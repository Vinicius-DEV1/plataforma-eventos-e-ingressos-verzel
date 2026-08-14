import { createApp } from './app';

const port = Number(process.env.PORT) || 3333;

createApp().listen(port, () => {
  console.log(`API ouvindo em http://localhost:${port}`);
});
