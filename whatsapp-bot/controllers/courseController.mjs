import * as db from '../database.mjs';

export const getAllCourses = async (req, res) => {
    try {
        const { upcoming } = req.query;
        const courses = await db.getCourses(upcoming === 'true');
        res.json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getCourse = async (req, res) => {
    try {
        const course = await db.getCourseById(req.params.id);
        if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
        
        const enrollments = await db.getCourseEnrollments(req.params.id);
        res.json({ success: true, data: { ...course, enrollments } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createCourse = async (req, res) => {
    try {
        const result = await db.createCourse(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateCourse = async (req, res) => {
    try {
        await db.updateCourse(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        await db.deleteCourse(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const enrollDevotee = async (req, res) => {
    try {
        const result = await db.enrollDevotee(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateEnrollment = async (req, res) => {
    try {
        await db.updateEnrollment(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteEnrollment = async (req, res) => {
    try {
        await db.deleteEnrollment(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const addPayment = async (req, res) => {
    try {
        const result = await db.addCoursePayment(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPayments = async (req, res) => {
    try {
        const payments = await db.getEnrollmentPayments(req.params.enrollmentId);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getCourseAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionDate, summary } = req.query;
        if (summary === 'true') {
            const data = await db.getCourseAttendanceSummary(id);
            res.json({ success: true, data });
        } else if (sessionDate) {
            const data = await db.getCourseAttendanceBySession(id, sessionDate);
            res.json({ success: true, data });
        } else {
            res.status(400).json({ success: false, error: 'Provide sessionDate or summary=true' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const markCourseAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { devoteeIds, sessionDate } = req.body;
        
        if (!devoteeIds || !Array.isArray(devoteeIds) || !sessionDate) {
            return res.status(400).json({ success: false, error: 'Invalid payload' });
        }

        await db.syncCourseAttendance(id, sessionDate, devoteeIds);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
