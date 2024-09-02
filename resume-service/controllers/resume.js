const { pool } = require('../db/dbsetup');

const uploadResumeDetails = async (req, res) => {
    const { name, job_title, job_description, job_company } = req.body;

    if (!name || !job_title || !job_description || !job_company) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO resumes (name, job_title, job_description, job_company) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, job_title, job_description, job_company]
        );

        const resumeId = result.rows[0].id;
        res.status(200).json({ resumeId });
    } catch (error) {
        console.error('Error inserting resume:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getResumeById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM resumes WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(404).json({ error: 'Resume not found' });
        }
    } catch (err) {
        console.error('Error retrieving resume by ID:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
}


const getResumeByName = async (req, res) => {
    
    const { name } = req.params;
    const nameParts = name.split('+');

    if (nameParts.length !== 2) {
        return res.status(400).json({ error: 'Invalid name format. Please provide both first and last name.' });
    }

    const [firstName, lastName] = nameParts;

    try {
        const resultExact = await pool.query(
            'SELECT * FROM resumes WHERE name ILIKE $1',
            [`${firstName} ${lastName}`]
        );

        if (resultExact.rows.length > 0) {
            return res.status(200).json(resultExact.rows);
        }

        const resultPartial = await pool.query(
            'SELECT * FROM resumes WHERE name ILIKE $1 OR name ILIKE $2',
            [`${firstName}%`, `%${lastName}`]
        );

        if (resultPartial.rows.length > 0) {
            return res.status(200).json(resultPartial.rows);
        } else {
            return res.status(404).json({ error: 'No matching resumes found' });
        }
    } catch (err) {
        console.error('Error retrieving resume by name:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
}


module.exports = {
    uploadResumeDetails,
    getResumeById,
    getResumeByName
}