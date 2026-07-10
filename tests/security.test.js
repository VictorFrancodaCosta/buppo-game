import test from 'node:test';
import assert from 'node:assert/strict';
import { createSecureId, escapeHTML, safeDisplayName, safeIdentifier, safeInteger } from '../js/security.js';

test('escapeHTML neutraliza marcação e atributos injetados', () => {
    assert.equal(
        escapeHTML(`<img src=x onerror="alert('x')">`),
        '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;'
    );
});

test('safeDisplayName remove controles, normaliza espaços e limita tamanho', () => {
    assert.equal(safeDisplayName('  ALICE\u0000   TESTE  ', 'JOGADOR', 12), 'ALICE TESTE');
    assert.equal(safeDisplayName('', 'JOGADOR'), 'JOGADOR');
});

test('safeIdentifier aceita somente caracteres seguros', () => {
    assert.equal(safeIdentifier('../match_<script>_01'), 'match_script_01');
});

test('safeInteger limita valores remotos sem produzir NaN', () => {
    assert.equal(safeInteger('12.9', 0, 0, 20), 12);
    assert.equal(safeInteger('invalido', 7, 0, 20), 7);
    assert.equal(safeInteger(999, 0, 0, 20), 20);
});

test('createSecureId produz identificadores válidos e distintos', () => {
    const first = createSecureId('match');
    const second = createSecureId('match');
    assert.match(first, /^match_[a-zA-Z0-9_-]+$/);
    assert.notEqual(first, second);
});
