// statsController.js
// Controller for dashboard statistics
const User = require('../models/userModel');
const Project = require('../models/projectModel');

const statsController = {
  async getTotalUsers(req, res) {
    try {
      const count = await User.countDocuments();
      res.json({ totalUsers: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getActiveUsers(req, res) {
    try {
      const count = await User.countDocuments({ userStatus: 'ACTIVE' });
      res.json({ activeUsers: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getNewUsers(req, res) {
    try {
      const { period = 'week' } = req.query;
      const date = new Date();
      if (period === 'day') date.setDate(date.getDate() - 1);
      else if (period === 'month') date.setMonth(date.getMonth() - 1);
      else date.setDate(date.getDate() - 7);
      const count = await User.countDocuments({ createdAt: { $gte: date } });
      res.json({ newUsers: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getUsersByStatus(req, res) {
    try {
      const statuses = await User.aggregate([
        { $group: { _id: '$userStatus', count: { $sum: 1 } } }
      ]);
      res.json({ usersByStatus: statuses });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getUsersWithProjects(req, res) {
    try {
      // Get unique user IDs from projects collection
      const userIds = await Project.distinct('userId', { userId: { $ne: null } });
      const count = userIds.length;
      res.json({ usersWithProjects: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getUsersWithoutProjects(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const userIds = await Project.distinct('userId', { userId: { $ne: null } });
      const usersWithProjects = userIds.length;
      const usersWithoutProjects = totalUsers - usersWithProjects;
      res.json({ usersWithoutProjects: usersWithoutProjects });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTopUsers(req, res) {
    try {
      const users = await Project.aggregate([
        { $match: { userId: { $ne: null } } },
        { $group: { _id: '$userId', projectCount: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $project: { _id: 1, name: '$userInfo.name', projectCount: 1 } },
        { $sort: { projectCount: -1 } },
        { $limit: 5 }
      ]);
      res.json({ topUsers: users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTotalProjects(req, res) {
    try {
      const count = await Project.countDocuments();
      res.json({ totalProjects: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getActiveProjects(req, res) {
    try {
      const count = await Project.countDocuments({ status: 'ACTIVE' });
      res.json({ activeProjects: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOpenProjects(req, res) {
    try {
      const count = await Project.countDocuments({ projectStatus: 'OPEN' });
      res.json({ openProjects: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getClosedProjects(req, res) {
    try {
      const count = await Project.countDocuments({ projectStatus: 'CLOSE' });
      res.json({ closedProjects: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getProjectsByApprovalStatus(req, res) {
    try {
      const statuses = await Project.aggregate([
        { $group: { _id: '$approvedStatus', count: { $sum: 1 } } }
      ]);
      res.json({ projectsByApprovalStatus: statuses });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getNewProjects(req, res) {
    try {
      const { period = 'week' } = req.query;
      const date = new Date();
      if (period === 'day') date.setDate(date.getDate() - 1);
      else if (period === 'month') date.setMonth(date.getMonth() - 1);
      else date.setDate(date.getDate() - 7);
      const count = await Project.countDocuments({ createdAt: { $gte: date } });
      res.json({ newProjects: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getProjectsByUser(req, res) {
    try {
      const projects = await Project.aggregate([
        { $match: { userId: { $ne: null } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $project: { userId: '$_id', userName: '$userInfo.name', count: 1 } }
      ]);
      res.json({ projectsByUser: projects });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getProjectsByModel(req, res) {
    try {
      const projects = await Project.aggregate([
        { $group: { _id: '$model', count: { $sum: 1 } } }
      ]);
      res.json({ projectsByModel: projects });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getProjectsWithoutUsers(req, res) {
    try {
      const projects = await Project.countDocuments({ 
        $or: [ 
          { userId: { $exists: false } }, 
          { userId: null } 
        ] 
      });
      res.json({ projectsWithoutUsers: projects });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getAverageProjectsPerUser(req, res) {
    try {
      const userCount = await User.countDocuments();
      const projectCount = await Project.countDocuments({ userId: { $ne: null } });
      const avg = userCount === 0 ? 0 : (projectCount / userCount);
      res.json({ averageProjectsPerUser: parseFloat(avg.toFixed(2)) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSummary(req, res) {
    try {
      const [
        totalUsers, 
        activeUsers, 
        totalProjects, 
        activeProjects, 
        openProjects,
        pendingProjects
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ userStatus: 'ACTIVE' }),
        Project.countDocuments(),
        Project.countDocuments({ status: 'ACTIVE' }),
        Project.countDocuments({ projectStatus: 'OPEN' }),
        Project.countDocuments({ approvedStatus: 'PENDING' })
      ]);
      
      res.json({ 
        totalUsers, 
        activeUsers,
        totalProjects, 
        activeProjects,
        openProjects,
        pendingProjects
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = statsController;
