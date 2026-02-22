// apps/calculator.js — Calculator App

const CalculatorApp = (() => {
  const APP_ID = 'calculator';
  let display = '0';
  let expression = '';
  let justCalc = false;

  function press(val) {
    if (val === 'C') { display = '0'; expression = ''; justCalc = false; }
    else if (val === '⌫') { display = display.length > 1 ? display.slice(0,-1) : '0'; }
    else if (val === '+/-') { display = display.startsWith('-') ? display.slice(1) : '-' + display; }
    else if (val === '%') { display = String(parseFloat(display) / 100); }
    else if (val === '=') {
      try {
        expression = display;
        display = String(Function('"use strict";return (' + display + ')')());
        if (display === 'Infinity' || display === 'NaN') display = 'Error';
        justCalc = true;
      } catch { display = 'Error'; }
    }
    else if (['+','-','×','÷'].includes(val)) {
      const op = val === '×' ? '*' : val === '÷' ? '/' : val;
      display += op;
      justCalc = false;
    }
    else {
      if (display === '0' || justCalc) { display = val; justCalc = false; }
      else display += val;
    }
    updateDisplay();
  }

  function updateDisplay() {
    const r = document.getElementById('calc-result');
    const e = document.getElementById('calc-expression');
    if (r) r.textContent = display.length > 14 ? parseFloat(display).toExponential(4) : display;
    if (e) e.textContent = expression;
  }

  function getHTML() {
    const btns = [
      ['C','⌫','%','÷'],
      ['7','8','9','×'],
      ['4','5','6','-'],
      ['1','2','3','+'],
      ['+/-','0','.','=']
    ];

    return `
      <div class="calc-app">
        <div class="calc-display">
          <div class="calc-expression" id="calc-expression"></div>
          <div class="calc-result" id="calc-result">0</div>
        </div>
        <div class="calc-grid">
          ${btns.flat().map(b => {
            const isOp = ['+','-','×','÷'].includes(b);
            const isEq = b === '=';
            const isFn = ['C','⌫','%','+/-'].includes(b);
            const cls = isEq ? 'eq' : isOp ? 'op' : isFn ? 'fn' : '';
            return `<button class="calc-btn ${cls}" onclick="CalculatorApp.press('${b}')">${b}</button>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  function open() {
    display = '0'; expression = ''; justCalc = false;
    WindowManager.create({
      id: APP_ID, title: 'Calculator', icon: '🔢',
      width: 280, height: 380, minWidth: 240, minHeight: 340,
      content: getHTML()
    });
  }

  AppLauncher.register(APP_ID, open);
  return { open, press };
})();