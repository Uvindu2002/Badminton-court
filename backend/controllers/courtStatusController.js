import CourtStatus from '../models/CourtStatus.js';

/**
 * @desc    Get all closed/maintenance slots for a specific date
 * @route   GET /api/court-status?date=YYYY-MM-DD
 * @access  Private
 */
const getCourtStatusByDate = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        res.status(400);
        throw new Error('Date parameter is required (format: YYYY-MM-DD)');
    }

    const statuses = await CourtStatus.find({ date }).sort({ startTime: 1 });

    res.json({
        success: true,
        count: statuses.length,
        data: statuses,
    });
};

/**
 * @desc    Close a court slot
 * @route   POST /api/court-status/close
 * @access  Private
 */
const closeCourtSlot = async (req, res) => {
    const { date, startTime, courtId, status = 'Closed', reason } = req.body;

    if (!date || !startTime || !courtId) {
        res.status(400);
        throw new Error('Please provide date, startTime, and courtId');
    }

    // Check if slot is already closed
    const existingStatus = await CourtStatus.findOne({ date, startTime, courtId });

    if (existingStatus) {
        res.status(400);
        throw new Error(`${courtId} is already closed at ${startTime}`);
    }

    // Handle "Both" courts
    if (courtId === 'Both') {
        const statuses = await Promise.all([
            CourtStatus.create({
                date,
                startTime,
                courtId: 'Court 1',
                status,
                reason: reason || 'Court closed by admin',
            }),
            CourtStatus.create({
                date,
                startTime,
                courtId: 'Court 2',
                status,
                reason: reason || 'Court closed by admin',
            }),
        ]);

        res.status(201).json({
            success: true,
            message: 'Both courts closed successfully',
            data: statuses,
        });
    } else {
        const courtStatus = await CourtStatus.create({
            date,
            startTime,
            courtId,
            status,
            reason: reason || 'Court closed by admin',
        });

        res.status(201).json({
            success: true,
            message: `${courtId} closed successfully`,
            data: courtStatus,
        });
    }
};

/**
 * @desc    Close entire day for a court
 * @route   POST /api/court-status/close-day
 * @access  Private
 */
const closeCourtDay = async (req, res) => {
    const { date, courtId, status = 'Closed', reason } = req.body;

    if (!date || !courtId) {
        res.status(400);
        throw new Error('Please provide date and courtId');
    }

    const TIME_SLOTS = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00',
    ];

    const courts = courtId === 'Both' ? ['Court 1', 'Court 2'] : [courtId];
    const closures = [];

    for (const court of courts) {
        for (const time of TIME_SLOTS) {
            // Check if already closed
            const existing = await CourtStatus.findOne({ date, startTime: time, courtId: court });
            
            if (!existing) {
                const closure = await CourtStatus.create({
                    date,
                    startTime: time,
                    courtId: court,
                    status,
                    reason: reason || 'Court closed for the day',
                });
                closures.push(closure);
            }
        }
    }

    res.status(201).json({
        success: true,
        message: `${courtId === 'Both' ? 'Both courts' : courtId} closed for entire day`,
        count: closures.length,
        data: closures,
    });
};

/**
 * @desc    Reopen a court slot (delete closed status)
 * @route   DELETE /api/court-status/:id
 * @access  Private
 */
const reopenCourtSlot = async (req, res) => {
    const courtStatus = await CourtStatus.findById(req.params.id);

    if (!courtStatus) {
        res.status(404);
        throw new Error('Court status not found');
    }

    await courtStatus.deleteOne();

    res.json({
        success: true,
        message: `${courtStatus.courtId} reopened successfully`,
        data: {},
    });
};

/**
 * @desc    Check if a specific slot is closed
 * @route   GET /api/court-status/check
 * @access  Private
 */
const checkSlotStatus = async (req, res) => {
    const { date, startTime, courtId } = req.query;

    if (!date || !startTime || !courtId) {
        res.status(400);
        throw new Error('Please provide date, startTime, and courtId');
    }

    const status = await CourtStatus.findOne({ date, startTime, courtId });

    res.json({
        success: true,
        isClosed: !!status,
        data: status,
    });
};

export {
    getCourtStatusByDate,
    closeCourtSlot,
    closeCourtDay,
    reopenCourtSlot,
    checkSlotStatus,
};
