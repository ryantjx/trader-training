// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Deployed to GitHub Pages as a project site, so the base path is the repo name.
// If a custom domain is used later, drop `base` and set `site` to the domain.
const SITE = 'https://ryantjx.github.io';
const BASE = '/trader-training';

export default defineConfig({
  site: SITE,
  base: BASE,
  // The manual is formula-heavy, so math has to render rather than showing as
  // literal dollar signs. remark-math parses it, rehype-katex renders it, and
  // the KaTeX stylesheet is imported globally below.
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    starlight({
      title: 'Trader Training',
      description:
        'Daily mental-math and market-knowledge drills for the Asian exotic-options desk.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ryantjx/trader-training' },
      ],
      // The sidebar mirrors the site's job: orient, practise, read, look up.
      // About comes first because the site now opens on what it is rather than
      // dropping the visitor into a timed question.
      sidebar: [
        { label: '1 About', link: '/' },
        { label: '2 Today', link: '/today' },
        {
          label: '3 Math',
          items: [
            { label: 'Greeks and PnL', link: '/quiz/greeks' },
            { label: 'Put-Call Parity', link: '/quiz/put-call-parity' },
            { label: 'Basis points and money', link: '/quiz/basis-points' },
            { label: 'FX', link: '/quiz/fx' },
            { label: 'Forwards', link: '/quiz/forwards' },
            { label: 'Vol and strikes', link: '/quiz/vol' },
          ],
        },
        {
          label: '4 Markets',
          items: [
            { label: 'Microstructure', link: '/quiz/microstructure' },
            { label: 'Tickers', link: '/quiz/tickers' },
            { label: 'Market knowledge', link: '/quiz/market-knowledge' },
          ],
        },
        {
          label: '5 Asia Derivatives',
          items: [
            { label: 'Listed derivatives', link: '/quiz/listed' },
            { label: 'Exotic options', link: '/quiz/exotic' },
            { label: 'Vol surface and skew', link: '/quiz/vol-surface' },
          ],
        },
        {
          label: '6 Manual',
          items: [
            { label: 'Start here', link: '/manual/' },
            { label: 'Math and units', link: '/manual/math/' },
            { label: 'Markets and microstructure', link: '/manual/markets/' },
            { label: 'Listed derivatives', link: '/manual/listed/' },
            { label: 'Exotic options', link: '/manual/exotics/' },
            { label: 'Glossary', link: '/manual/glossary/' },
          ],
        },
        {
          label: '7 Market reference',
          items: [
            { label: 'Exchange overview', link: '/reference/' },
            { label: 'SGX', link: '/reference/sgx' },
            { label: 'HKEX', link: '/reference/hkex' },
            { label: 'JPX', link: '/reference/jpx' },
            { label: 'ASX', link: '/reference/asx' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css', 'katex/dist/katex.min.css'],
    }),
    react(),
  ],
});

