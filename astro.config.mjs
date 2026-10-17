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
        {
          label: 'Quizzes',
          items: [
            { label: 'Today', link: '/' },
            { label: 'Math', link: '/drill/math' },
            { label: 'Markets', link: '/drill/markets' },
            { label: 'Asia Derivatives', link: '/drill/derivatives' },
            { label: 'Put-call parity', link: '/parity' },
          ],
        },
        {
          label: 'Content',
          items: [
            { label: 'SGX', link: '/reference/sgx' },
            { label: 'HKEX', link: '/reference/hkex' },
            { label: 'JPX', link: '/reference/jpx' },
            { label: 'ASX', link: '/reference/asx' },
          ],
        },
        { label: 'Progress', link: '/stats' },
        { label: 'About', link: '/about' },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
    react(),
  ],
});
