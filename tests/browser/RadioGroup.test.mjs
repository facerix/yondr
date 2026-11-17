import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { before, after, beforeEach, afterEach } from 'node:test';
import { launchChrome } from './chrome.mjs';

let browser;
let page;
const source = await readFile(new URL('../../dist/components/RadioGroup.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const markup = `<radio-group label="Living costs">
  <radio-option value="relocate" checked><img alt="" /> Relocate</radio-option>
  <radio-option value="commute">Commute</radio-option>
</radio-group>`;

before(async () => { browser = await launchChrome(); });
after(async () => { await browser?.close(); });
beforeEach(async () => {
  page = await browser.newPage();
  await page.evaluate(async url => {
    await import(url);
    window.mount = html => {
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.append(container);
      return container.querySelector('radio-group');
    };
    window.settle = () => new Promise(resolve => setTimeout(resolve, 0));
  }, moduleUrl);
});
afterEach(async () => { await page?.close(); });

test('declarations render as labeled native controls with encapsulated content and styles', async () => {
  assert.deepEqual(await page.evaluate(html => {
    const style = document.createElement('style');
    style.textContent = 'label { display: none !important } img { width: 999px !important }';
    document.head.append(style);
    const group = mount(html);
    const root = group.shadowRoot;
    const image = root.querySelector('img');
    return {
      value: group.value,
      caption: root.querySelector('legend').textContent,
      count: root.querySelectorAll('input[type="radio"]').length,
      labelVisible: getComputedStyle(root.querySelector('label')).display !== 'none',
      imageEncapsulated: getComputedStyle(image).width !== '999px',
      cloned: image !== group.querySelector('img'),
      noSlot: root.querySelector('slot') === null,
      declarationsUnrendered: group.firstElementChild.getClientRects().length === 0,
    };
  }, markup), {
    value: 'relocate', caption: 'Living costs', count: 2, labelVisible: true,
    imageEncapsulated: true, cloned: true, noSlot: true, declarationsUnrendered: true,
  });
  const { nodes } = await page.send('Accessibility.getFullAXTree');
  assert.ok(nodes.some(node => node.role?.value === 'group' && node.name?.value?.toLowerCase() === 'living costs'),
    JSON.stringify(nodes.map(node => [node.role?.value, node.name?.value, node.ignored])));
  assert.ok(nodes.some(node => node.role?.value === 'radio' && node.name?.value === 'Relocate'));
});

test('value sets and clears selection without firing events, and rejects unknown values', async () => {
  assert.deepEqual(await page.evaluate(html => {
    const group = mount(html);
    let changes = 0;
    group.addEventListener('change', () => changes++);
    group.value = 'commute';
    const selected = group.shadowRoot.querySelector('input:checked').value;
    let invalidRejected = false;
    try { group.value = 'missing'; } catch (error) { invalidRejected = error instanceof RangeError; }
    const retained = group.value;
    group.value = '';
    return { selected, invalidRejected, retained, value: group.value,
      checked: group.shadowRoot.querySelectorAll('input:checked').length, changes };
  }, markup), { selected: 'commute', invalidRejected: true, retained: 'commute', value: '', checked: 0, changes: 0 });
});

test('user selection emits one public input and change event with the updated value', async () => {
  assert.deepEqual(await page.evaluate(html => {
    const group = mount(html);
    const events = [];
    for (const type of ['input', 'change']) document.addEventListener(type, event => {
      events.push([event.type, event.target === group, group.value]);
    });
    group.shadowRoot.querySelectorAll('label')[1].click();
    group.shadowRoot.querySelectorAll('label')[1].click();
    return events;
  }, markup), [['input', true, 'commute'], ['change', true, 'commute']]);
});

test('native keyboard navigation skips disabled options, wraps, and isolates groups', async () => {
  await page.evaluate(() => {
    window.first = mount(`<radio-group label="First">
      <radio-option value="a" checked>A</radio-option>
      <radio-option value="b" disabled>B</radio-option>
      <radio-option value="c">C</radio-option>
    </radio-group>`);
    window.second = mount(`<radio-group label="Second">
      <radio-option value="a" checked>A</radio-option><radio-option value="c">C</radio-option>
    </radio-group>`);
    first.shadowRoot.querySelector('input').focus();
  });
  const arrow = async () => {
    await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  };
  await arrow();
  assert.deepEqual(await page.evaluate(() => [first.value, second.value,
    first.shadowRoot.activeElement?.value, first.shadowRoot.activeElement?.matches(':focus-visible')]), ['c', 'a', 'c', true]);
  await arrow();
  assert.deepEqual(await page.evaluate(() => [first.value, second.value]), ['a', 'a']);
});

test('capturing listeners also receive each event once with the current selection', async () => {
  assert.deepEqual(await page.evaluate(html => {
    const group = mount(html);
    const events = [];
    for (const type of ['input', 'change']) document.addEventListener(type, event => {
      events.push([event.type, event.target === group, group.value, event.composed]);
    }, { capture: true });
    group.shadowRoot.querySelectorAll('label')[1].click();
    return events;
  }, markup), [['input', true, 'commute', true], ['change', true, 'commute', true]]);
});

test('empty groups and unchecked declarations have no implicit selection', async () => {
  assert.deepEqual(await page.evaluate(() => {
    const empty = mount('<radio-group label="Empty"></radio-group>');
    const unchecked = mount('<radio-group label="Choices"><radio-option value="a">A</radio-option></radio-group>');
    const multiple = mount(`<radio-group label="Defaults"><radio-option value="a" checked>A</radio-option>
      <radio-option value="b" checked>B</radio-option></radio-group>`);
    const detached = document.createElement('radio-group');
    detached.innerHTML = '<radio-option value="a" checked>A</radio-option><radio-option value="b">B</radio-option>';
    detached.value = 'b';
    document.body.append(detached);
    return [empty.value, unchecked.value, multiple.value, detached.value];
  }), ['', '', 'b', 'b']);
});

test('group and option disabled states prevent selection without discarding the value', async () => {
  assert.deepEqual(await page.evaluate(async html => {
    const group = mount(html);
    const option = group.lastElementChild;
    option.setAttribute('disabled', '');
    await settle();
    group.shadowRoot.querySelectorAll('label')[1].click();
    const optionDisabled = group.value;
    option.removeAttribute('disabled');
    await settle();
    group.disabled = true;
    group.shadowRoot.querySelectorAll('label')[1].click();
    const groupDisabled = group.value;
    const effective = [...group.shadowRoot.querySelectorAll('input')].every(input => input.matches(':disabled'));
    group.disabled = false;
    group.shadowRoot.querySelectorAll('label')[1].click();
    return { optionDisabled, groupDisabled, effective, enabled: group.value };
  }, markup), { optionDisabled: 'relocate', groupDisabled: 'relocate', effective: true, enabled: 'commute' });
});

test('declaration edits preserve selection and focus, while additions and removals update controls', async () => {
  assert.deepEqual(await page.evaluate(async html => {
    const group = mount(html);
    group.value = 'commute';
    const input = group.shadowRoot.querySelector('input:checked');
    input.focus();
    group.firstElementChild.querySelector('img').setAttribute('alt', 'Updated icon');
    group.lastElementChild.lastChild.textContent = 'Updated commute';
    await settle();
    const preserved = group.value === 'commute' && group.shadowRoot.activeElement === input;
    const copied = group.shadowRoot.querySelector('img').alt === 'Updated icon'
      && group.shadowRoot.textContent.includes('Updated commute');
    group.lastElementChild.setAttribute('value', 'train');
    await settle();
    const renamed = group.value;
    group.insertAdjacentHTML('beforeend', '<radio-option value="new" checked>New</radio-option>');
    await settle();
    const added = group.value;
    group.lastElementChild.remove();
    await settle();
    return { preserved, copied, renamed, added, removed: group.value,
      count: group.shadowRoot.querySelectorAll('input').length };
  }, markup), { preserved: true, copied: true, renamed: 'train', added: 'new', removed: '', count: 2 });
});

test('checked and caption attributes update, including after reconnecting', async () => {
  assert.deepEqual(await page.evaluate(async html => {
    const group = mount(html);
    group.lastElementChild.setAttribute('checked', '');
    group.setAttribute('label', 'Travel');
    await settle();
    const selected = group.value;
    group.remove();
    group.lastElementChild.removeAttribute('checked');
    document.body.append(group);
    group.firstElementChild.setAttribute('value', 'moving');
    await settle();
    group.firstElementChild.removeAttribute('checked');
    await settle();
    group.firstElementChild.setAttribute('checked', '');
    await settle();
    return { selected, reconnected: group.value, caption: group.shadowRoot.querySelector('legend').textContent };
  }, markup), { selected: 'commute', reconnected: 'moving', caption: 'Travel' });
});

test('invalid declarations fail explicitly instead of creating ambiguous controls', async () => {
  assert.deepEqual(await page.evaluate(() => {
    return [
      '<radio-option>Missing value</radio-option>',
      '<radio-option value="x">A</radio-option><radio-option value="x">B</radio-option>',
      '<opt value="x">Unsupported declaration</opt>',
    ].map(html => {
      const group = document.createElement('radio-group');
      group.innerHTML = html;
      try { group.value = 'x'; return false; } catch (error) { return error instanceof TypeError; }
    });
  }), [true, true, true]);
});

test('the plan page supplies declarative living-cost options with a working default', async () => {
  const html = await readFile(new URL('../../plan/index.html', import.meta.url), 'utf8');
  const control = html.match(/<radio-group\b[^>]*id="living-mode"[^>]*>[\s\S]*?<\/radio-group>/)?.[0];
  assert.ok(control, 'plan page must use the radio-group component');
  assert.deepEqual(await page.evaluate(html => {
    const group = mount(html);
    const initial = group.value;
    group.shadowRoot.querySelectorAll('label')[1].click();
    return { initial, selected: group.value, count: group.querySelectorAll('radio-option').length };
  }, control), { initial: 'relocate', selected: 'commute', count: 2 });
});

test('option label attributes become hover and focus popovers that name the control once', async () => {
  // Chrome applies hover state on the next frame after input.
  const visible = () => page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return [...document.querySelector('radio-group').shadowRoot.querySelectorAll('.popover')]
      .map(popover => getComputedStyle(popover).visibility === 'visible');
  });
  const rect = await page.evaluate(() => {
    const group = mount(`<radio-group label="Salaries">
      <radio-option value="off" checked label="Fixed"><img alt="" /></radio-option>
      <radio-option value="max" label="Maximum"><img alt="" /></radio-option>
      <radio-option value="plain">Plain</radio-option>
    </radio-group>`);
    const { x, y, width, height } = group.shadowRoot.querySelectorAll('label')[1].getBoundingClientRect();
    return { x: x + width / 2, y: y + height / 2 };
  });
  assert.deepEqual(await page.evaluate(() => {
    const root = document.querySelector('radio-group').shadowRoot;
    return [...root.querySelectorAll('label')].map(label => label.querySelector('.popover')?.textContent ?? null);
  }), ['Fixed', 'Maximum', null]);
  assert.deepEqual(await visible(), [false, false]);

  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
  assert.deepEqual(await visible(), [false, true]);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });

  await page.evaluate(() => document.querySelector('radio-group').shadowRoot.querySelector('input').focus({ focusVisible: true }));
  await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  assert.deepEqual(await visible(), [false, true]);

  const { nodes } = await page.send('Accessibility.getFullAXTree');
  const radios = nodes.filter(node => node.role?.value === 'radio').map(node => node.name?.value);
  assert.deepEqual(radios, ['Fixed', 'Maximum', 'Plain']);

  assert.deepEqual(await page.evaluate(async () => {
    const group = document.querySelector('radio-group');
    group.children[0].setAttribute('label', 'Constant');
    group.children[1].removeAttribute('label');
    group.children[2].setAttribute('label', 'Labeled');
    await settle();
    return [...group.shadowRoot.querySelectorAll('label')].map(label => label.querySelector('.popover')?.textContent ?? null);
  }), ['Constant', null, 'Labeled']);
});
