/* ──────────────────────────────────────────────────────────
   PHONE MASK · +7 (XXX) XXX-XX-XX
   Vanilla, без зависимостей. Применяется ко всем input[type=tel],
   а также к input[name=phone] и input[data-mask=phone].
   ────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  function formatRu(digits) {
    digits = digits.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits[0] === '8' || digits[0] === '7') digits = '7' + digits.slice(1);
    else digits = '7' + digits;
    digits = digits.slice(0, 11);

    const p1 = digits.slice(1, 4);
    const p2 = digits.slice(4, 7);
    const p3 = digits.slice(7, 9);
    const p4 = digits.slice(9, 11);

    let out = '+7';
    if (p1) out += ' (' + p1;
    if (p1.length === 3) out += ')';
    if (p2) out += ' ' + p2;
    if (p3) out += '-' + p3;
    if (p4) out += '-' + p4;
    return out;
  }

  function attach(input) {
    if (!input || input.dataset.maskAttached === '1') return;
    input.dataset.maskAttached = '1';
    input.setAttribute('type', 'tel');
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', 'tel');
    input.setAttribute('maxlength', '18');
    if (!input.placeholder || /\+7\s_+/.test(input.placeholder)) {
      input.placeholder = '+7 (___) ___-__-__';
    }

    function update() {
      const raw = input.value.replace(/\D/g, '');
      const next = formatRu(raw);
      // Сохраняем позицию каретки относительно конца
      const tailFromEnd = input.value.length - (input.selectionStart || 0);
      input.value = next;
      const newPos = Math.max(0, next.length - tailFromEnd);
      try { input.setSelectionRange(newPos, newPos); } catch (e) {}
      // Валидация: 11 цифр - ок, иначе - не ок (но не блокируем UI пока пусто)
      const digits = input.value.replace(/\D/g, '');
      if (digits.length === 0) input.setCustomValidity('');
      else if (digits.length === 11) input.setCustomValidity('');
      else input.setCustomValidity('Введите полный номер телефона');
    }

    input.addEventListener('input', update);

    input.addEventListener('keydown', function (e) {
      // Allow control keys
      const ok = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Escape'];
      if (ok.indexOf(e.key) !== -1) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^[0-9+]$/.test(e.key)) e.preventDefault();
    });

    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });
    input.addEventListener('blur', function () {
      if (input.value === '+7 (' || input.value === '+7') input.value = '';
    });

    input.addEventListener('paste', function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      input.value = formatRu(text);
      input.dispatchEvent(new Event('input'));
    });
  }

  function init() {
    const selectors = [
      'input[type="tel"]',
      'input[name="phone"]',
      'input[data-mask="phone"]'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(attach);

    // Прохватываем поля, добавленные после загрузки (модалки, бриф и т.п.)
    const mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes && m.addedNodes.forEach(function (node) {
          if (!(node instanceof Element)) return;
          if (node.matches && node.matches(selectors.join(','))) attach(node);
          node.querySelectorAll && node.querySelectorAll(selectors.join(',')).forEach(attach);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual attachment if needed
  window.RPARK_PHONE_MASK = { attach: attach, format: formatRu };
})();
