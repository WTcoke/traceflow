import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Trace Server is healthy');
});

app.listen(PORT, () => {
  console.log(`Trace Server is running on port ${PORT}`);
});
