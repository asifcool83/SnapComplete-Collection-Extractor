# Verification

Source checked: `https://snapcomplete.com/u/abjcwf/cards`

Fresh browser reloads were performed on 2026-08-15 (Dubai time). Each pass waited for the rendered grid, extracted real DOM card data, checked owned and unowned states, round-tripped the result through `JSON.stringify`/`JSON.parse`, and spot-checked Doctor Octopus Fractured Frontier, Red Wolf Fractured Frontier, Zombie Galacti, and Thanos against the live card classes.

| Test | Page loaded | Cards | Owned | Unowned | JSON parsed | Spot checks | Result |
|---|---|---:|---:|---:|---|---|---|
| Test 1 | PASS | 486 | 305 | 181 | PASS | PASS | **PASS** |
| Test 2 | PASS | 486 | 305 | 181 | PASS | PASS | **PASS** |
| Test 3 | PASS | 486 | 305 | 181 | PASS | PASS | **PASS** |

Consistency: all three sorted name/slug/ownership signatures matched exactly.

Spot checks in all three passes:

- Doctor Octopus Fractured Frontier — owned
- Red Wolf Fractured Frontier — unowned
- Zombie Galacti — owned
- Thanos — unowned

Series totals also reconciled to the card grid on every pass: S1/2 `97/97`, S3 `125/125`, S4 `57/88`, and S5 `26/176`.
