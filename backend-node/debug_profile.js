const { Student, Resume } = require('./src/models');

async function test() {
    try {
        const student = await Student.findOne({ 
            where: { id: 1 },
            include: [{
                model: Resume,
                attributes: ['id', 'resumeText', 'createdAt'],
                order: [['createdAt', 'DESC']]
            }]
        });
        console.log("SUCCESS!")
    } catch(e) {
        console.log("ERROR!", e.message);
    }
}
test();
