/* ============================================================
   Learn Something New — legal.js
   Legal documents (Terms, Privacy, Accessibility, Disclaimer)
   and the click-to-accept consent banner.

   The documents are exposed on window.LEGAL and rendered by
   app.js via the #legal/<doc> route. The consent banner is a
   self-contained module at the bottom of this file.
   ============================================================ */

(function () {
  'use strict';

  // --- Edit these to suit your deployment --------------------------------
  // Replace the placeholder address below with a real contact email before
  // publishing. It is woven into every document automatically.
  var CONTACT_EMAIL = 'your-email@example.com';
  var SITE_NAME = 'Learn Something New';
  var UPDATED = 'June 1, 2026';
  // Optional jurisdiction for the governing-law clause. Leave as-is or set to
  // e.g. 'the State of California, United States'.
  var JURISDICTION = 'your local jurisdiction';
  // -----------------------------------------------------------------------

  var mail = '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>';

  // Shorthand cross-links between documents (resolve via the hash router).
  function link(key, label) {
    return '<a href="#legal/' + key + '">' + label + '</a>';
  }

  // ---- Terms of Service --------------------------------------------------

  var TERMS =
    '<p>Welcome to ' + SITE_NAME + ' (the “Site”). These Terms of Service ' +
    '(“Terms”) govern your access to and use of the Site. By visiting or ' +
    'using the Site, you agree to be bound by these Terms and by our ' +
    link('privacy', 'Privacy Policy') + '. If you do not agree, please do ' +
    'not use the Site.</p>' +

    '<h3>1. What the Site is</h3>' +
    '<p>' + SITE_NAME + ' is a free, non-commercial educational reading ' +
    'project. It presents written explanations of ideas across a range of ' +
    'subjects. There are no accounts to create, nothing to purchase, and no ' +
    'user-submitted content.</p>' +

    '<h3>2. Permission to use</h3>' +
    '<p>You may read, share links to, and learn from the Site for personal, ' +
    'educational, and non-commercial purposes. The underlying source code is ' +
    'released under the MIT License; the written content remains the ' +
    'intellectual property of its authors and may not be copied wholesale or ' +
    'republished as your own. See the ' + link('disclaimer', 'Disclaimer &amp; Notices') +
    ' for details.</p>' +

    '<h3>3. Acceptable use</h3>' +
    '<p>You agree not to misuse the Site. In particular, you will not:</p>' +
    '<ul>' +
      '<li>attempt to disrupt, overload, or gain unauthorized access to the ' +
        'Site or its hosting infrastructure;</li>' +
      '<li>scrape or harvest content in a manner that places an unreasonable ' +
        'load on the Site, or that strips authorship and republishes it;</li>' +
      '<li>use the Site in violation of any applicable law or regulation; or</li>' +
      '<li>remove, obscure, or alter any copyright or attribution notices.</li>' +
    '</ul>' +

    '<h3>4. Educational content, not professional advice</h3>' +
    '<p>The Site is provided for general information and learning. It is not ' +
    'professional advice — medical, legal, financial, or otherwise — and ' +
    'should not be relied upon as such. Always consult a qualified ' +
    'professional before acting on anything you read here. See the ' +
    link('disclaimer', 'Disclaimer &amp; Notices') + '.</p>' +

    '<h3>5. Third-party links and services</h3>' +
    '<p>The Site may reference or link to third-party resources, and it loads ' +
    'web fonts from a third-party provider. We do not control those services ' +
    'and are not responsible for their content or practices. Your use of them ' +
    'is governed by their own terms.</p>' +

    '<h3>6. No warranty</h3>' +
    '<p>The Site is provided “as is” and “as available,” without warranties ' +
    'of any kind, whether express or implied, including but not limited to ' +
    'warranties of accuracy, completeness, merchantability, fitness for a ' +
    'particular purpose, and non-infringement. We do not warrant that the ' +
    'Site will be uninterrupted, error-free, or free of harmful components.</p>' +

    '<h3>7. Limitation of liability</h3>' +
    '<p>To the fullest extent permitted by law, the authors and operators of ' +
    'the Site will not be liable for any indirect, incidental, special, ' +
    'consequential, or punitive damages, or any loss arising out of your use ' +
    'of — or inability to use — the Site, even if advised of the possibility ' +
    'of such damages.</p>' +

    '<h3>8. Changes to these Terms</h3>' +
    '<p>We may update these Terms from time to time. The “Last updated” date ' +
    'below reflects the most recent revision. Continued use of the Site after ' +
    'changes take effect constitutes acceptance of the revised Terms.</p>' +

    '<h3>9. Governing law</h3>' +
    '<p>These Terms are governed by the laws of ' + JURISDICTION + ', without ' +
    'regard to conflict-of-law principles.</p>' +

    '<h3>10. Contact</h3>' +
    '<p>Questions about these Terms? Reach us at ' + mail + '.</p>';

  // ---- Privacy Policy ----------------------------------------------------

  var PRIVACY =
    '<p>Your privacy matters. This Privacy Policy explains what information ' +
    SITE_NAME + ' (the “Site”) does and does not collect. In short: the Site ' +
    'is a static reading project that asks for nothing about you and sets no ' +
    'tracking or advertising cookies.</p>' +

    '<h3>1. Information we collect</h3>' +
    '<p><strong>We do not collect personal information.</strong> There are no ' +
    'accounts, no sign-up forms, no newsletters, and no analytics or ' +
    'advertising trackers built into the Site. We do not ask for your name, ' +
    'email, or any other identifying detail to read.</p>' +

    '<h3>2. Local storage on your device</h3>' +
    '<p>The Site uses your browser’s local storage to remember small ' +
    'preferences — for example, that you have acknowledged the consent ' +
    'notice. This information stays on your device, is never transmitted to ' +
    'us, and you can clear it at any time through your browser settings.</p>' +

    '<h3>3. Information handled by our hosting provider</h3>' +
    '<p>The Site is hosted on GitHub Pages. Like virtually all web servers, ' +
    'GitHub may automatically log standard technical request data — such as ' +
    'your IP address, browser type, and the pages requested — for security ' +
    'and operational purposes. This processing is governed by GitHub’s own ' +
    'privacy practices, available in the ' +
    '<a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" ' +
    'target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.</p>' +

    '<h3>4. Web fonts</h3>' +
    '<p>The Site loads typefaces from Google Fonts. When your browser ' +
    'requests these fonts, your IP address and request details are visible to ' +
    'Google as part of delivering the files. See the ' +
    '<a href="https://policies.google.com/privacy" target="_blank" ' +
    'rel="noopener noreferrer">Google Privacy Policy</a> and ' +
    '<a href="https://developers.google.com/fonts/faq/privacy" target="_blank" ' +
    'rel="noopener noreferrer">Google Fonts &amp; privacy</a> for details.</p>' +

    '<h3>5. Cookies and tracking</h3>' +
    '<p>The Site sets no cookies of its own and runs no third-party ' +
    'analytics, advertising, or social-media tracking pixels. We do not ' +
    'build advertising profiles, and we do not sell or share any information ' +
    'about you — because we do not collect any.</p>' +

    '<h3>6. Children’s privacy</h3>' +
    '<p>The Site is suitable for a general audience and does not knowingly ' +
    'collect personal information from anyone, including children under 13. ' +
    'Because no personal information is collected, no such data is stored or ' +
    'processed.</p>' +

    '<h3>7. Your choices</h3>' +
    '<p>You can browse most of the Site with cookies and JavaScript ' +
    'restricted, clear local storage at any time, and use browser or network ' +
    'tools to block third-party font requests if you prefer.</p>' +

    '<h3>8. Changes to this policy</h3>' +
    '<p>We may revise this Privacy Policy as the Site evolves. The “Last ' +
    'updated” date below reflects the latest version.</p>' +

    '<h3>9. Contact</h3>' +
    '<p>Questions about privacy? Write to us at ' + mail + '.</p>';

  // ---- Accessibility Statement -------------------------------------------

  var ACCESSIBILITY =
    '<p>' + SITE_NAME + ' is built to be read comfortably by as many people ' +
    'as possible. We aim to conform to the Web Content Accessibility ' +
    'Guidelines (WCAG) 2.1 at Level AA, and we treat accessibility as part of ' +
    'the craft of the Site rather than an afterthought.</p>' +

    '<h3>Measures we take</h3>' +
    '<ul>' +
      '<li><strong>Semantic structure</strong> — headings, landmarks, and ' +
        'lists are marked up meaningfully so assistive technology can convey ' +
        'the page’s shape.</li>' +
      '<li><strong>Keyboard navigation</strong> — the Site is fully operable ' +
        'with a keyboard, including a “Skip to content” link and arrow-key ' +
        'navigation through reading depths.</li>' +
      '<li><strong>Focus management</strong> — after each navigation, focus ' +
        'moves to the new content and is clearly indicated with a visible ' +
        'focus outline.</li>' +
      '<li><strong>Screen-reader announcements</strong> — a polite live ' +
        'region announces navigation changes so context is never lost.</li>' +
      '<li><strong>Reduced motion</strong> — animations and transitions are ' +
        'softened or disabled when your system requests reduced motion.</li>' +
      '<li><strong>Readable contrast and type</strong> — colours and font ' +
        'sizes are chosen for legibility, and the layout reflows for zoom and ' +
        'small screens.</li>' +
    '</ul>' +

    '<h3>Known limitations</h3>' +
    '<p>Some decorative illustrations are presented as ambient background and ' +
    'are intentionally hidden from assistive technology. We are continually ' +
    'reviewing the Site and welcome reports of anything that gets in your way.</p>' +

    '<h3>Feedback</h3>' +
    '<p>If you encounter an accessibility barrier, please tell us at ' + mail +
    '. Describe the issue and the page or feature involved, and we will do our ' +
    'best to address it promptly.</p>';

  // ---- Disclaimer & Notices ----------------------------------------------

  var DISCLAIMER =
    '<p>This page collects the remaining notices that apply to your use of ' +
    SITE_NAME + ' (the “Site”). It supplements, and should be read alongside, ' +
    'our ' + link('terms', 'Terms of Service') + ' and ' +
    link('privacy', 'Privacy Policy') + '.</p>' +

    '<h3>Educational purpose</h3>' +
    '<p>All content on the Site is offered for general educational and ' +
    'informational purposes only. While written with care, it may be ' +
    'simplified, abbreviated, or become out of date, and it is <strong>not</strong> ' +
    'a substitute for professional advice. Nothing here constitutes medical, ' +
    'legal, financial, or other professional guidance. Consult a qualified ' +
    'professional before making decisions based on what you read.</p>' +

    '<h3>Accuracy</h3>' +
    '<p>We strive for correctness but make no warranty that the content is ' +
    'complete, current, or free of error. You use the information at your own ' +
    'discretion and risk.</p>' +

    '<h3>External links</h3>' +
    '<p>The Site may link to third-party websites for reference. We do not ' +
    'endorse and are not responsible for the content, accuracy, or practices ' +
    'of those external sites.</p>' +

    '<h3>Intellectual property</h3>' +
    '<p>The written essays and original artwork are © ' + SITE_NAME + ' and its ' +
    'authors, all rights reserved unless otherwise noted. The Site’s source ' +
    'code is made available under the MIT License. Trademarks and names ' +
    'mentioned in the content belong to their respective owners and are used ' +
    'for identification and educational purposes only.</p>' +

    '<h3>“As is”</h3>' +
    '<p>The Site and its content are provided “as is,” without warranties of ' +
    'any kind. See the ' + link('terms', 'Terms of Service') + ' for the full ' +
    'disclaimer of warranties and limitation of liability.</p>' +

    '<h3>Contact</h3>' +
    '<p>For any questions about these notices, reach us at ' + mail + '.</p>';

  // ---- Public registry ---------------------------------------------------

  window.LEGAL = {
    updated: UPDATED,
    contactEmail: CONTACT_EMAIL,
    order: ['terms', 'privacy', 'accessibility', 'disclaimer'],
    docs: {
      terms: {
        key: 'terms',
        title: 'Terms of Service',
        eyebrow: 'The Agreement',
        glyph: '§',
        html: TERMS
      },
      privacy: {
        key: 'privacy',
        title: 'Privacy Policy',
        eyebrow: 'What We Keep',
        glyph: '✦',
        html: PRIVACY
      },
      accessibility: {
        key: 'accessibility',
        title: 'Accessibility',
        eyebrow: 'Open to All',
        glyph: '❂',
        html: ACCESSIBILITY
      },
      disclaimer: {
        key: 'disclaimer',
        title: 'Disclaimer & Notices',
        eyebrow: 'The Fine Print',
        glyph: '❧',
        html: DISCLAIMER
      }
    }
  };

  // ======================================================================
  //  Consent banner — click to accept
  // ======================================================================

  var CONSENT_KEY = 'lsn-consent-v1';

  function consentStored() {
    try { return window.localStorage.getItem(CONSENT_KEY) === 'accepted'; }
    catch (e) { return false; } // storage blocked (e.g. private mode)
  }

  function storeConsent() {
    try { window.localStorage.setItem(CONSENT_KEY, 'accepted'); }
    catch (e) { /* non-fatal: banner simply reappears next visit */ }
  }

  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.className = 'consent-banner';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Privacy and terms notice');

    wrap.innerHTML =
      '<div class="consent-inner">' +
        '<div class="consent-glyph" aria-hidden="true">✦</div>' +
        '<div class="consent-text">' +
          '<p class="consent-title">A quiet note before you read</p>' +
          '<p class="consent-body">' +
            'This site collects no personal data and sets no tracking cookies. ' +
            'It stores a small preference on your device to remember this ' +
            'notice. By continuing, you agree to our ' +
            '<a href="#legal/terms">Terms</a> and ' +
            '<a href="#legal/privacy">Privacy Policy</a>.' +
          '</p>' +
        '</div>' +
        '<div class="consent-actions">' +
          '<a class="consent-link" href="#legal/privacy">Learn more</a>' +
          '<button type="button" class="consent-accept" data-action="accept">' +
            'Accept &amp; continue' +
          '</button>' +
        '</div>' +
      '</div>';

    var accept = wrap.querySelector('[data-action="accept"]');
    if (accept) {
      accept.addEventListener('click', function () {
        storeConsent();
        dismiss(wrap);
      });
    }
    return wrap;
  }

  function dismiss(wrap) {
    if (!wrap) return;
    wrap.classList.add('is-leaving');
    var prefersReduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var remove = function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
    if (prefersReduced) { remove(); }
    else { setTimeout(remove, 420); }
    document.body.classList.remove('has-consent-banner');
  }

  function showBanner() {
    if (consentStored()) return;
    if (document.querySelector('.consent-banner')) return;
    var banner = buildBanner();
    document.body.appendChild(banner);
    document.body.classList.add('has-consent-banner');
    // Reveal on the next frame so the entrance transition runs.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { banner.classList.add('is-in'); });
    });
  }

  // Expose a hook so a "manage preferences" control could re-open it later.
  window.LEGAL.showConsentBanner = showBanner;
  window.LEGAL.resetConsent = function () {
    try { window.localStorage.removeItem(CONSENT_KEY); } catch (e) { /* noop */ }
    showBanner();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
