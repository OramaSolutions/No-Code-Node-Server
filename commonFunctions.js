const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const bucket = require("aws-sdk");
const moment = require("moment");
const puppeteer = require('puppeteer');

// const QRCode = require('qrcode-svg');

const pdf = require("html-pdf");
const s3 = new bucket.S3({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.BUCKET_REGION
});

const encryptString = (str) => {
    return bcrypt.hashSync(str, 8);
};
const getOTP = () => {
    let otp = Math.floor(100000 + Math.random() * 9000);
    return otp;
};
const requestOTP = () => {
    let otp = Math.floor(1000 + Math.random() * 9000);
    return otp;
};
const sendMail = (email, subject, content, callback) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
    });
    let mailOptions = {
        from: "do_not_reply@gmail.com",
        to: email,
        subject: subject,
        html: content,
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            {
                console.log(error);
                console.error("email failed for ", email);
                return callback(error, null);
            }
        }
        console.info("This mail sent to >> " + info.envelope.to);
        return callback(null, info.response);
    });
};
const sendForgetMail = (email, subject, link, content, callback) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "shivammobu@gmail.com",
            pass: "wgnqjryopvhfaqrh",
        },
    });
    let mailOptions = {
        from: "No reply<fdfsd8055@gmail.com>",
        to: email,
        subject: subject,
        html: `<!DOCTYPE html>
<html lang="en-us">
<head>
    <title>Orama</title>
    <meta charset="UTF-8" />
    <meta name="description" content="" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />  
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        body{ margin: 0; font-family: 'Roboto'; font-size: 14px; } 
        *{ box-sizing: border-box;} 
    </style>
</head>
<body>

    <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin:auto;">
        <tr>
            <td style="background: #F5F5F5; padding: 50px 20px;">

                <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 700px; margin:0px auto; background-color: #fff; padding: 30px; border-radius: 10px; ">
                    <tr>
                        <td>
                            <table style="width: 100%; border-radius: 10px; overflow: hidden;">
                                <tr>
                                    <td colspan="2" style="border-bottom:1px solid #ddd; padding:10px 0 15px 0;">
                                        <span style="display: block; width: 200px; margin: auto;">
                                            <img src="https://mobulous.co.in/Orama/admin/images/Logo.png" style="width:100%">   
                                        </span>
                                    </td> 
                                </tr>

                                <tr>
                                    <td style="padding:20px 0 10px 0"> 
                                        <h2 style="margin:0">Hello, </h2>
                                    </td>
                                </tr>

                                <tr> 
                                    <td colspan="2" style="padding:0px 0 30px 0">
                                        <p style="margin: 0 0 10px; line-height: 30px;">
                                            <span>Greetings from Orama!</span>
                                        </p>                      

                                        <p style="margin: 0 0 10px; line-height: 30px;">
                                            <span>We've received a request to reset the password for the <span style="color:#000; font-weight:500">Orama</span> account associated with the email id 
                                                <span style="color:#000; font-weight:500"><%=email%>.</span>
                                            </span>
                                        </p>

                                        <!-- <p style="margin: 0 0 10px; line-height: 30px;">
                                            <span>Use the following OTP to complete your password reset procedures.</span>
                                        </p> -->

                                        <p style="margin: 10px 0 0 0; line-height: 30px;">
                                            <a href=${link} style="display: block; background-color: #1e75bd; text-align: center; width:200px; margin: auto; color: #fff; padding:6px 0; border-radius: 5px">
                                                Verify
                                            </a>    
                                        </p>    
                                    </td> 
                                </tr>    
 
                                <tr> 
                                    <td colspan="2" style="padding:0px 0 30px 0">
                                        <p style="margin: 0; line-height: 30px;">
                                            <span>If you didn't request this code, you can ignore this email. Someone else might have typed your email address by mistake.</span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>Cheers</span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>Orama Support</span>
                                        </p>
                                    </td>
                                </tr> 
                                <tr>
                                    <td style="border-top: 1px solid #ddd; padding:20px 0 "> 
                                        <p style="margin: 10px 0 0 0; line-height: 30px; text-align: center;">
                                            <span>Copyright © 2024 Orama, All rights reserved.</span>
                                        </p>
                                    </td>
                                </tr> 
 
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

</body>
</html>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            {
                console.log(error);
                console.error("email failed for ", email);
                return callback(error, null);
            }
        }
        console.info("This mail sent to >> " + info.envelope.to);
        return callback(null, info.response);
    });
};
const sendOtpMail = (email, subject, otp, content, callback) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "shivammobu@gmail.com",
            pass: "wgnqjryopvhfaqrh",
        },
    });
    let mailOptions = {
        from: "No reply<fdfsd8055@gmail.com>",
        to: email,
        subject: subject,
        html: `    
<!DOCTYPE html>
<html lang="en-us">
<head>
    <title>Dash</title>
    <meta charset="UTF-8" />
    <meta name="description" content="" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />  
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        body{ margin: 0; font-family: 'Roboto'; font-size: 14px; } 
        *{ box-sizing: border-box;} 
    </style>
</head>
<body>

    <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin:auto;">
        <tr>
            <td style="background: #F5F5F5; padding: 50px 20px;">

                <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 700px; margin:0px auto; background-color: #fff; padding: 30px; border-radius: 10px; ">
                    <tr>
                        <td>
                            <table style="width: 100%; border-radius: 10px; overflow: hidden;">
                                <tr>
                                    <td colspan="2" style="border-bottom:1px solid #ddd; padding:10px 0 15px 0;">
                                        <span style="display: block; width: 150px; margin: auto;">
                                            <img src="img/new_logo.png" style="width:100%">   
                                        </span>
                                    </td> 
                                </tr>

                                <tr>
                                    <td style="padding:20px 0 10px 0"> 
                                        <h2 style="margin:0">Dear User</h2>
                                    </td>
                                </tr>

                                <tr> 
                                    <td colspan="2" style="padding:0px 0 30px 0">
                                        <p style="margin: 0; line-height: 30px;">
                                            <span>
                                                Thank you for signing up for our services. In order to complete the verification of your email address, we need to verify that you are the owner of this email address.
                                            </span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>To do so, please use the following One-Time Password (OTP) to verify your email address:</span>
                                        </p> 

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>${otp}</span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>
                                                Please enter this OTP on the verification page. This OTP is valid for the next 15 minutes.
                                            </span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>
                                                If you did not request this verification, please ignore this email.
                                            </span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>
                                                Thank you for your cooperation.
                                            </span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>
                                                Best regards,
                                            </span>
                                        </p>

                                        <p style="margin: 0; line-height: 30px;">
                                            <span>
                                                Dash ,
                                            </span>
                                        </p>

                                    </td>
                                </tr>   
                                
                            </table>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            {
                console.log(error);
                console.error("email failed for ", email);
                return callback(error, null);
            }
        }
        console.info("This mail sent to >> " + info.envelope.to);
        return callback(null, info.response);
    });
};
const sendPasswordMail = (
    email,
    subject,
    userName,
    description,
    taskName,
    versionNumber,
    projectName,
    content,
    callback
) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
    });
    console.log("req data", userName,
        description,
        taskName,
        versionNumber,
        projectName,)
    let mailOptions = {
        from: "No reply<fdfsd8055@gmail.com>",
        to: email,
        subject: subject,
        html: `<!DOCTYPE html>
<html lang="en-us">
  <head>
    <title>News</title>
    <meta charset="UTF-8" />
    <meta name="description" content="" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
    />
<style>
  .form-group{display:flex; }
  label{width:120px}
  .form-control{width:150px}
</style>
  </head>

  <body>
      <div class="BoxContainer">
        <div class="Box">
         
          <form>
            <div class="form-group">
              <label>User Name : </label>
            <span>${userName}</span>
            </div>

            <div class="form-group">
              <label>Model : </label>
              <span>${taskName}</span>
            </div>
            <div class="form-group">
              <label> Version : </label>
              <span>${versionNumber}</span>
            </div>
            <div class="form-group">
              <label> Project : </label>
              <span>${projectName}</span>
            </div>
            <div class="form-group">
              <label> Description : </label>
              <span>${description}</span>
            </div>
          </form>
        </div>
      </div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="js/bootstrap.min.js"></script>
  </body>
</html>
`
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            {
                console.log(error);
                console.error("email failed for ", email);
                return callback(error, null);
            }
        }
        console.info("This mail sent to >> " + info.envelope.to);
        return callback(null, info.response);
    });
};
function getRandomNumber(end) {
    return Math.floor(Math.random() * end);
}



const searchAsPerDateTime = (search, startDate, endDate, timeframe) => {
    if (!startDate == '' && !endDate == "") {
        let eDate = new Date(endDate)
        eDate.setDate(eDate.getDate() + 1)
        console.log("endDates==>", eDate)
        search.createdAt = {
            $gte: new Date(startDate),
            $lte: eDate
        }
    }

    if (timeframe === "Today") {
        //    let startTodayDate = new Date(moment().format())
        let setTodayDate = new Date()
        setTodayDate.setHours(0o0, 0o0, 59, 999);
        let todayDate = new Date()
        todayDate.setHours(23, 59, 59, 999);
        search.createdAt = {
            $gte: setTodayDate,
            $lte: todayDate
        }
    }
    if (timeframe == "Week") {
        let weekDate = new Date(moment().startOf('isoWeek').format())
        let todayDate = new Date()
        todayDate.setHours(23, 59, 59, 999);
        search.createdAt = {
            $gte: weekDate,
            $lte: todayDate
        }
    }
    if (timeframe === "Month") {
        let monthDate = new Date(moment().clone().startOf('month').format())
        let todayDate = new Date()
        todayDate.setHours(23, 59, 59, 999);
        search.createdAt = {
            $gte: monthDate,
            $lte: todayDate
        }
    }
    if (timeframe === "Year") {
        let monthDate = new Date(moment().clone().startOf("year").format());
        let todayDate = new Date();
        todayDate.setHours(23, 59, 59, 999);
        search.createdAt = {
            $gte: monthDate,
            $lte: todayDate,
        };
    }
}


module.exports = {
    encryptString: encryptString,
    getOTP: getOTP,
    requestOTP: requestOTP,
    sendOtpMail: sendOtpMail,
    sendPasswordMail: sendPasswordMail,
    sendMail: sendMail,
    getRandomNumber,
    searchAsPerDateTime,
    sendForgetMail,
    s3
    // pdfGenerate: pdfGenerate
};
