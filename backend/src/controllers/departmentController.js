const Department = require('../models/Department');

exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.json({ success: true, departments });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
        res.json({ success: true, department });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const department = await Department.create(req.body);
        res.status(201).json({ success: true, department });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, department });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Department deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
