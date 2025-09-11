const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Project = require('../../models/projectModel');


// Load ECDSA private key PEM (adjust path as needed)
const privateKeyPem = fs.readFileSync(path.join(__dirname, '../../private_key.pem'), 'utf8');

// Helper: Sort object keys recursively for consistent JSON serialization
function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sortObjectKeys);
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
    }, {});
}

// Sign license JSON string and return DER signature hex
function signLicenseData(licenseJson) {
    const sign = crypto.createSign('SHA256');
    sign.update(licenseJson);
    sign.end();

    const signatureBuffer = sign.sign({
        key: privateKeyPem,
        format: 'pem',
        type: 'pkcs8',
    });

    return signatureBuffer.toString('hex');
}

async function findProjectByIdOrAppId(projectId, app_id) {
    if (projectId) {
        return await Project.findById(projectId);
    }
    if (app_id) {
        return await Project.findOne({ 'applicationStatus.app_id': app_id });
    }
    return null;
}

// Issue a license for a project
exports.issueLicense = async (req, res) => {
    try {
        const { projectId, app_id, machine_fingerprint } = req.body;
         if (!projectId && !app_id) {
            return res.status(400).json({ error: "Missing projectId and app_id" });
        }
        if ( !machine_fingerprint) {
            return res.status(400).json({ error: "Missing machine_fingerprint" });
        }

        const project = await findProjectByIdOrAppId(projectId, app_id);
        if (!project) return res.status(404).json({ error: "Project not found" });



        if (project.applicationStatus?.status === 'active') {
            return res.status(409).json({
                error: "Project already has an active license",
                active_machine: project.applicationStatus.machine_fingerprint.slice(0, 16) + '...'
            });
        }

        const license_id = crypto.randomBytes(16).toString('hex');
        const nonce = crypto.randomBytes(8).toString('hex');
        const issued = Math.floor(Date.now() / 1000);
        const fp_requirements = {
            cpu_info: true,
            motherboard_serial: true,
            bios_uuid: true,
            mac_addresses: true,
            disk_serial: true,
            system_uuid: true,
        };

        const licenseData = {
            app_id,
            license_id,
            m: machine_fingerprint,
            f: ["full_access"],
            issued,
            e: null,
            nonce,
            fp_requirements
        };

        const licenseJson = JSON.stringify(sortObjectKeys(licenseData));

        const signatureHex = signLicenseData(licenseJson);

        project.applicationStatus = {
            appDownloaded: true,
            downloadedFromIp: req.ip,
            downloadTime: new Date(),
            app_id,
            license_id,
            status: 'active',
            issued,
            machine_fingerprint,
            last_verification: issued
        };

        await project.save();

        return res.json({
            license_json: licenseJson,
            signature: signatureHex,
            license_id
        });

    } catch (err) {
        console.error("Error issuing license:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Deactivate the license linked to a project
exports.deactivateLicense = async (req, res) => {
    try {
        const { projectId, app_id, machine_fingerprint } = req.body;
        if (!projectId && !app_id) {
            return res.status(400).json({ error: "Missing projectId or app_id" });
        }

        const project = await findProjectByIdOrAppId(projectId, app_id);
        if (!project) return res.status(404).json({ error: "Project not found" });

        if (project.applicationStatus?.status !== 'active') {
            return res.status(404).json({ error: "No active license found for this project" });
        }

        if (machine_fingerprint && project.applicationStatus.machine_fingerprint !== machine_fingerprint) {
            return res.status(403).json({ error: "Machine fingerprint does not match licensed machine" });
        }

        project.applicationStatus.status = 'deactivated';
        project.applicationStatus.deactivatedAt = Math.floor(Date.now() / 1000);

        await project.save();

        return res.json({ message: "License deactivated successfully" });

    } catch (err) {
        console.error("Error deactivating license:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
