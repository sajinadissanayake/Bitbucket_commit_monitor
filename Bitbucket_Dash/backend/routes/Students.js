const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// Student Signup route
router.post('/signup', async (req, res) => {
  try {
    const { serviceId, name, groupNumber, username, password, token, workspaceName, role, projectName, projectStartDate, projectEndDate, teamMembers } = req.body;
    
    // Validation checks
    const errors = {};
    
    // Check for required fields
    if (!serviceId) errors.serviceId = 'Service ID is required';
    if (!name) errors.name = 'Name is required';
    if (!groupNumber) errors.groupNumber = 'Group number is required';
    if (!username) errors.username = 'Username is required';
    if (!password) errors.password = 'Password is required';
    if (!token) errors.token = 'Token is required';
    if (!workspaceName) errors.workspaceName = 'Workspace name is required';
    if (!role) errors.role = 'Role is required';
    if (!projectName) errors.projectName = 'Project name is required';
    if (!projectStartDate) errors.projectStartDate = 'Project start date is required';
    if (!projectEndDate) errors.projectEndDate = 'Project end date is required';
    
    // Validate role
    const validRoles = ['PM', 'QA', 'Developer', 'DevOps'];
    if (role && !validRoles.includes(role)) {
      errors.role = 'Invalid role. Must be PM, QA, Developer, or DevOps';
    }
    
    // Validate team members if provided
    if (teamMembers && Array.isArray(teamMembers)) {
      const teamMembersErrors = [];
      
      teamMembers.forEach((member, index) => {
        const memberErrors = {};
        if (!member.name) memberErrors.name = 'Team member name is required';
        if (!member.role) memberErrors.role = 'Team member role is required';
        else if (!validRoles.includes(member.role)) {
          memberErrors.role = 'Invalid role. Must be PM, QA, Developer, or DevOps';
        }
        
        if (Object.keys(memberErrors).length > 0) {
          teamMembersErrors.push({ index, errors: memberErrors });
        }
      });
      
      if (teamMembersErrors.length > 0) {
        errors.teamMembers = teamMembersErrors;
      }
    }
    
    // Validate dates
    let startDate, endDate;
    if (projectStartDate) {
      startDate = new Date(projectStartDate);
      if (isNaN(startDate.getTime())) {
        errors.projectStartDate = 'Invalid start date format';
      }
    }
    
    if (projectEndDate) {
      endDate = new Date(projectEndDate);
      if (isNaN(endDate.getTime())) {
        errors.projectEndDate = 'Invalid end date format';
      }
    }
    
    if (startDate && endDate && startDate > endDate) {
      errors.projectEndDate = 'End date must be after start date';
    }
    
    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }
    
    // Check if username already exists
    const existingStudent = await Student.findOne({ username });
    if (existingStudent) {
      return res.status(400).json({ 
        errors: { username: 'Username already exists' }
      });
    }
    
    // Check if service ID already exists
    const existingServiceId = await Student.findOne({ serviceId });
    if (existingServiceId) {
      return res.status(400).json({ 
        errors: { serviceId: 'Service ID already exists' }
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new student with properly parsed Date objects
    const student = new Student({
      serviceId,
      name,
      groupNumber,
      username,
      password: hashedPassword,
      token,
      workspaceName,
      role,
      projectName,
      projectStartDate: startDate,
      projectEndDate: endDate,
      teamMembers: teamMembers || []
    });
    
    // Log the dates to verify they're in the correct format
    console.log(`Saving student with dates: ${student.projectStartDate} - ${student.projectEndDate}`);
    
    await student.save();
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error occurred', error: error.message });
  }
});



router.get("/", async (req, res) => {
  try {
      const students = await Student.find({}).lean();
      
      // Add formatted date examples for the first student
      if (students.length > 0) {
        const sampleStudent = students[0];
        console.log('Sample student from GET /api/students:', {
          name: sampleStudent.name,
          projectStartDate: sampleStudent.projectStartDate,
          projectStartDateISO: sampleStudent.projectStartDate ? new Date(sampleStudent.projectStartDate).toISOString() : null,
          projectEndDate: sampleStudent.projectEndDate,
          projectEndDateISO: sampleStudent.projectEndDate ? new Date(sampleStudent.projectEndDate).toISOString() : null,
          teamMembers: sampleStudent.teamMembers ? sampleStudent.teamMembers.length : 0
        });
      }
      
      res.status(200).json({ success: true, data: students });
  } catch (error) {
      console.log('Error in fetching students:', error.message);
      res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// New DELETE route to remove a student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the student
    const deletedStudent = await Student.findByIdAndDelete(id);

    // If no student found
    if (!deletedStudent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Student deleted successfully',
      data: deletedStudent 
    });

  } catch (error) {
    console.error('Error deleting student:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred', 
      error: error.message 
    });
  }
});

module.exports = router;