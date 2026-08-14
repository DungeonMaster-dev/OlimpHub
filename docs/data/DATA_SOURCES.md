# Политика источников и адаптеров данных

**Задача backlog:** P0-010  
**Статус:** базовая политика  
**Дата:** 14 августа 2026  
**Связанные документы:** [Codeforces API](CODEFORCES_API.md), [другие источники](OTHER_SOURCES.md), [модель каталога](../architecture/DATABASE.md)

## Принцип

Каждая внешняя запись в OlimpHub должна отвечать на четыре вопроса: **какой источник**, **на каком основании доступен контент**, **когда и каким адаптером она была получена**, **можно ли безопасно/легально отображать или хранить этот фрагмент**. Внешняя платформа не является частью OlimpHub, а её API/страницы не дают автоматического права копировать statement, тесты, editorials или решения.

## Source registry

| `sourceId`         | Стартовый режим            | Разрешённый MVP data scope                                                                                     | Запрещённый scope без отдельного разрешения                         |
| ------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `codeforces`       | `api_metadata`             | Problem metadata, tags, contest/problem ref, публичные user submissions через документированные методы и link. | Локальное зеркало statement/editorial/test data, чужой source code. |
| `atcoder`          | `link_only_pending_rights` | Внешняя ссылка и ручная curator запись после правовой проверки.                                                | Автоматический scraper/importer/mirror.                             |
| `cses`             | `link_only_pending_rights` | Внешняя ссылка и одобренная metadata policy.                                                                   | Массовое копирование задач/тестов/editorials.                       |
| `kattis`           | `link_only_pending_rights` | Внешняя ссылка после source review.                                                                            | Автоматизированный импорт без письменного/совместимого разрешения.  |
| `olympiad_archive` | `case_by_case`             | Только запись с конкретным rightsholder/licence evidence.                                                      | Предположение, что олимпиадный архив свободен для зеркалирования.   |
| `manual_curated`   | `curator`                  | Собственные/явно лицензированные задачи с recorded licence.                                                    | Публикация без provenance/review.                                   |

P0-003a остаётся блокером для любого non-Codeforces automated importer или local content mirror. Каждый новый источник добавляет source profile, права, data mapping, failure strategy, тестовые fixtures и владельца.

## Адаптерный контракт

```text
SourceAdapter
  getSourceDescriptor(): SourceDescriptor
  fetchProblemIndex(cursor?): SourcePage
  fetchProblemMetadata(ref): SourceProblemObservation
  fetchPublicUserActivity(handle, cursor?): SourceSubmissionPage
  normalise(observation): CanonicalCandidate
  classifyFailure(error): transient | rate_limited | unauthorised | contract_changed | permanent
```

Adapter не пишет канонические таблицы напрямую. Он возвращает observation c source identifier, raw payload hash, fetchedAt, source URL, adapter version и content/right scope. Отдельный normalisation/review pipeline проверяет schema, dedupe и policy, создаёт `ProblemSourceRef`/`ExternalSubmission` и outbox event. Исходный payload имеет ограниченную retention и redaction policy; он не становится неявным public API.

## Codeforces

Codeforces — единственный запланированный автоматический источник Phase 1. Адаптер использует только официальные API методы, документированные в `CODEFORCES_API.md`, с explicit timeout, rate-limit backoff, idempotent cursor/checkpoint и контрактными fixtures. Problem identity исходит из source ID и external key, а не title; tags являются source observations и отображаются отдельно от approved Skill Map.

`user.status` нужен для добровольно linked публичного handle; `includeSources` не является предпосылкой MVP и исходники внешнего judge не хранятся. Ошибки `FAILED`/HTTP failure/неожиданный payload не меняют успешный snapshot на пустой результат и создают source-health observation. Rejudge/изменение verdict создаёт новую observation/version, а не тихо переписывает historical fact.

## Provenance и content access

| Поле                                                 | Назначение                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `sourceId`, `externalKey`, `sourceUrl`               | Стабильная внешняя идентичность и трассировка.                                |
| `adapterVersion`, `fetchedAt`, `rawPayloadHash`      | Воспроизводимость import/diagnostic без обязательного хранения всего payload. |
| `licenceStatus`, `accessMode`, `rightsEvidenceRef`   | Явное правило, почему и как можно показывать данные.                          |
| `normalisationVersion`, `reviewStatus`, `reviewedBy` | Отличает факт источника от утверждённой внутренней записи.                    |
| `supersedesRefId`/`validFrom`                        | Позволяет сохранить историю изменения внешней записи.                         |

`accessMode` ограничен `external_link`, `metadata_only`, `licensed_local_content`, `user_private_content`, `restricted`. UI и API фильтруют content по mode до получения DTO. Нельзя полагаться на скрытие кнопки: сервер не возвращает statement/test data для `external_link` и `metadata_only`.

## Импортный pipeline

1. Scheduler ставит source sync с cursor, budget и policy version.
2. Adapter получает bounded page, валидирует transport/schema и сохраняет observation с provenance.
3. Normalizer переводит source vocabulary в candidate, не делая непроверенный тег skill.
4. Deduper применяет source uniqueness и candidate fingerprints; ambiguous matches отправляет на review, не merge автоматически.
5. Policy gate проверяет access/licence scope.
6. Approved change пишет canonical record/version и outbox; failure/unknown фиксируется как observability data.
7. Checkpoint продвигается только после durable processing; re-run безопасен.

Полный backfill требует отдельной budget/rate/rights review. Scheduler ограничивает concurrency per source, honour-ит server retry hints и использует jitter; source incident имеет circuit breaker, чтобы не ухудшать чужую платформу или API OlimpHub.

## Качество и тесты

| Проверка                 | Критерий                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Adapter contract fixture | Известный payload нормализуется в стабильный candidate; unknown field не меняет значения silently. |
| Idempotent re-import     | Повтор той же страницы не дублирует ref/problem/submission.                                        |
| Contract drift           | Отсутствующее required field даёт `contract_changed`, сохранённый snapshot остаётся читабелен.     |
| Rights gate              | `external_link` не возвращает local statement/hidden data через API.                               |
| Dedupe                   | Два источника с похожим title не merge без explicit review evidence.                               |
| Rate/failure             | 429/timeout применяют retry/circuit policy без busy loop.                                          |
| Provenance               | Каждая опубликованная problem/source ref имеет source URL, время и access mode.                    |
| Privacy                  | External handle/submission не импортируется до explicit link/consent.                              |

## Операционные сигналы

По каждому source собираются freshness успешного snapshot, success/error/rate-limit ratio, cursor lag, unknown tag count, contract drift, records awaiting review и права/лицензия warnings. Пользовательский UI показывает «данные обновлены …» и source availability, но не заявляет, что внешний source гарантированно полон/актуален.
