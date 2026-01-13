import generateToken from '../utils/generateToken.js';

/**
 * @desc    Authenticate admin & get token
 * @route   POST /api/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    // Get credentials from environment variables
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    // Validate input
    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password');
    }

    // Check credentials
    if (username === adminUser && password === adminPass) {
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                username: adminUser,
                token: generateToken('admin'),
            },
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
};

/**
 * @desc    Verify admin token
 * @route   GET /api/admin/verify
 * @access  Private
 */
const verifyAdmin = async (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        data: {
            admin: req.admin,
        },
    });
};

export { loginAdmin, verifyAdmin };
