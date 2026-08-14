# Безопасность OlimpHub: модель угроз и baseline controls

**Задача backlog:** P0-010  
**Статус:** базовая политика  
**Дата:** 14 августа 2026  
**Владелец:** `Security & Reliability`

## Цель

OlimpHub обрабатывает личную историю обучения, заметки, внешний профиль, потенциально пользовательский исходный код и интеграционные секреты. Базовый уровень безопасности строится как проверяемые требования к продукту и разработке, а не как набор фреймворк-настроек. OWASP ASVS используется как источник проверяемых требований к web-приложениям и сервисам.[1] Процесс разработки ориентируется на риск-ориентированные практики NIST SSDF: подготовку, защиту компонентов, выпуск защищённого ПО и реакцию на уязвимости.[2]

## Активы и доверенные границы

| Актив | Основная угроза | Базовая защита |
|---|---|---|
| Учётная запись, сессия, recovery data | Захват аккаунта и сессии. | Server-side authentication, безопасные HttpOnly/Secure cookies, ротация/отзыв сессий, защита от перебора. |
| Личный прогресс, заметки, попытки | Несанкционированное чтение/изменение. | Авторизация владельца на каждом сценарии, tenant scoping на сервере, audit событий и тесты запрета доступа. |
| Внешние аккаунты/токены | Кража credentials или ложная привязка. | Секреты только server-side, явное consent/link flow, статус верификации, отзыв и rotation. |
| Условия/тесты задач | Нарушение прав и утечка hidden tests. | Source access policy, provenance, content scope, encrypted trusted store, минимальные проекции. |
| Пользовательский код | Escape/DoS/exfiltration. | Отдельный microVM execution plane; политика в `EXECUTION_SECURITY.md`. |
| AI context и ответы | Prompt injection, утечка, подсказка-решение. | Allowlisted context, структурированные outputs, disclosure ceiling, zero write-tools; `AI_ARCHITECTURE.md`. |
| Telegram token/webhook | Захват Bot API и поддельные updates. | Secret manager, webhook secret header, idempotent inbox; `TELEGRAM_ARCHITECTURE.md`. |

## Обязательные controls

| Область | Требование | Проверка |
|---|---|---|
| Authentication | Идентификация и управление сессией происходят только на сервере; нет токенов в localStorage, URL или логах. | Тесты cookie flags, session fixation/logout/revocation и rate limits входа. |
| Authorization | Каждая read/write операция проверяет user/role/resource ownership на сервере. | Integration tests «пользователь A не может читать/менять данные B». |
| Input/Output | Все API входы проходят строгую schema validation; HTML/Markdown и внешние тексты санитизируются контекстно. | Fuzz/negative tests на invalid enum, ID, oversized payload, XSS/injection. |
| CSRF/CORS | Cookie-based изменяющие запросы имеют защиту CSRF; CORS — точный allowlist. | Browser integration tests для cross-origin/post scenarios. |
| Rate limiting | Лимиты на login, linking, search, AI, webhook и execution jobs с безопасным 429. | Concurrency tests и метрики rejected/retry requests. |
| Secrets | Ключи, tokens, API secrets, private URLs и private test data не попадают в Git/клиент/логи. | Secret scanning в CI, redaction tests, review config changes. |
| Storage | Шифрование в transit, минимизация PII, backups/recovery, отдельные credentials по сервису. | Restore drill и проверка доступа к backup. |
| Dependencies | Версии пиннингуются, supply-chain сканирование и обновление по risk policy. | CI dependency/SBOM scanning до релиза. |
| Observability | Логи структурированы, PII/codes/secrets redacted, события доступа и sensitive actions auditируются. | Log inspection/redaction tests, alert coverage. |
| Incident response | Kill switches для AI, Telegram и execution; роли/контакты/rollback документированы. | Tabletop exercise до публичного запуска. |

## Особые угрозы

### Данные и API

IDOR — главный риск персональной платформы, поэтому UI-фильтр не считается защитой. Публичный DTO никогда не является исходной ORM-моделью. Отдельные read/write use cases должны строить scope от server session, затем проверять ownership и status ресурса. Пагинация, сортировка и фильтры разрешены только из closed enums/ограниченных наборов; они не принимают SQL/field path или произвольный URL.

### Интеграции и внешние данные

Любая страница задачи, API error, callback, Telegram update, source tag, attachment и код — недоверенный ввод. Интеграции работают через адаптеры, имеют least-privilege credentials, timeouts, bounded retries и provenance. Права на контент определяются до хранения; режим `external_link` не может эволюционировать в локальное зеркало без документированного разрешения.

### AI и код

LLM не получает database access, secrets или write-tools. Решение о раскрытии подсказки принимается server policy, а не ответом модели. User code запускается только в отдельной одноразовой изолированной execution environment с network=none и ресурсными лимитами. Эти две зоны рассматриваются как высокорисковые и включаются после независимого security review.

## Secure development baseline

Перед началом Phase 1 должен появиться автоматизированный набор: formatter/linter/typecheck, unit/integration tests, secret scan, dependency scan, CodeQL/SAST или эквивалент, protected CI, SBOM и review policy. Любое новое sensitive surface сопровождается threat note, тестами негативного доступа и обновлением документации. Security exception имеет owner, срок, компенсационный control и не может быть «временным TODO».

OWASP ASVS 5.0.0 будет зафиксирован как версия baseline; ссылки на конкретные пункты в будущих проверках включают версию, потому что идентификаторы стандарта меняются между версиями.[1] NIST SSDF используется как структура для непрерывного улучшения, а не как формальная декларация соответствия.[2]

## Release gates

| Gate | До чего обязателен |
|---|---|
| AuthN/AuthZ integration tests | До первой персональной read/write функции. |
| Secret/dependency scanning | До первого production deployment. |
| Privacy/retention/export policy | До публичного сбора activity telemetry. |
| Full execution threat review | До любой кнопки запуска пользовательского кода. |
| AI red-team and leakage suite | До AI Coach для пользователей. |
| Telegram webhook/link security tests | До webhook enablement. |
| Incident/restore drill | До beta с реальными личными данными. |

## References

[1]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[2]: https://csrc.nist.gov/projects/ssdf "NIST Secure Software Development Framework"
