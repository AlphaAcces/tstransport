import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI-key service listening on http://localhost:${PORT}`);
});
