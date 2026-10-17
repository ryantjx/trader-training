// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

// Deployed to GitHub Pages as a project site, so the base path is the repo name.
// If a custom domain is used later, drop `base` and set `site` to the domain.
const SITE = 'https://ryantjx.github.io';
const BASE = '/trader-training';

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [
    starlight({
      title: 'Trader Training',
      description:
        'Daily mental-math and market-knowledge drills for the Asian exotic-options desk.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ryantjx/trader-training' },
      ],
      sidebar: [
        { label: '1 Today', link: '/' },
        {
          label: '2 Math',
          items: [
            { label: 'Greeks and PnL', link: '/quiz/greeks' },
            { label: 'Put-call parity', link: '/quiz/put-call-parity' },
            { label: 'Basis points and money', link: '/quiz/basis-points' },
            { label: 'FX', link: '/quiz/fx' },
            { label: 'Forwards', link: '/quiz/forwards' },
            { label: 'Vol and strikes', link: '/quiz/vol' },
          ],
        },
        {
          label: '3 Markets',
          items: [
            { label: 'Microstructure', link: '/quiz/microstructure' },
            { label: 'Tickers', link: '/quiz/tickers' },
            { label: 'Market knowledge', link: '/quiz/market-knowledge' },
          ],
        },
        {
          label: '4 Asia Derivatives',
          items: [
            { label: 'Listed derivatives', link: '/quiz/listed' },
            { label: 'Exotic options', link: '/quiz/exotic' },
            { label: 'Vol surface and skew', link: '/quiz/vol-surface' },
          ],
        },
        {
          label: '5 Content',
          items: [
            { label: 'SGX', link: '/reference/sgx' },
            { label: 'HKEX', link: '/reference/hkex' },
            { label: 'JPX', link: '/reference/jpx' },
            { label: 'ASX', link: '/reference/asx' },
          ],
        },
        { label: '6 Progress', link: '/stats' },
        { label: '7 About', link: '/about' },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
    react(),
  ],
});
