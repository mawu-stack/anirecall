// pages/_app.js
import Head from 'next/head';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>AniRecall — You remember the scene. We’ll find the anime.</title>
        <meta name="description" content="AI agent that identifies anime from anything you remember: plot, scenes, characters, powers, setting, dialogue, or when and where you watched it." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238B5CF6'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
