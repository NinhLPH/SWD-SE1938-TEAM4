const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// API thử nghiệm
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Xin chào từ Backend Express!' });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});