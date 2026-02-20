export const ADMIN_CHANGELOG_VERSION = "v0.52.0-admin";

export type AdminChangelogEntry = {
  version: string;
  date: string;
  titleRo: string;
  titleEn: string;
  itemsRo: string[];
  itemsEn: string[];
};

export const adminChangelog: AdminChangelogEntry[] = [
  {
    version: "v0.52.0-admin",
    date: "2026-02-20",
    titleRo: "Dashboard Admin curatat + KPI executive + grafice operationale",
    titleEn: "Cleaned Admin dashboard + executive KPIs + operational charts",
    itemsRo: [
      "Dashboard-ul admin a fost simplificat prin eliminarea sectiunilor redundante, pastrand doar blocurile critice pentru decizie rapida.",
      "Au fost adaugate KPI-uri executive cu trend (aplicari 24h, timp mediu pana la publish, publish rate, runtime errors).",
      "Task Center prioritizat pentru actiuni imediate (review queue, expirari, erori, backup/companies).",
      "Au fost introduse grafice noi: distributie status joburi (donut), top companii dupa aplicari (horizontal bars) si timeline publicari/aplicari.",
    ],
    itemsEn: [
      "Admin dashboard was simplified by removing redundant sections and keeping only decision-critical blocks.",
      "New executive KPIs with trends were added (24h applications, avg time to publish, publish rate, runtime errors).",
      "A prioritized Task Center was introduced for immediate actions (review queue, expirations, errors, backup/companies).",
      "New visual charts were added: job-status distribution (donut), top companies by applications (horizontal bars), and publish/application timeline.",
    ],
  },
  {
    version: "v0.51.0-admin",
    date: "2026-02-20",
    titleRo: "Hardening securitate pentru operatiuni interne",
    titleEn: "Security hardening for internal operations",
    itemsRo: [
      "Au fost adaugate headere de securitate la nivel global (nosniff, frame-deny, referrer-policy, permissions-policy, COOP/CORP).",
      "Endpoint-urile interne pentru housekeeping si digest valideaza acum secretul prin comparatie timing-safe.",
      "Curatare operationala repo: artefactele locale (uploads, backups, sqlite db) sunt excluse prin .gitignore.",
    ],
    itemsEn: [
      "Global security headers were added (nosniff, frame-deny, referrer-policy, permissions-policy, COOP/CORP).",
      "Internal housekeeping and digest endpoints now validate secrets using timing-safe comparison.",
      "Operational repo cleanup: local artifacts (uploads, backups, sqlite db) are now excluded via .gitignore.",
    ],
  },
  {
    version: "v0.50.0-admin",
    date: "2026-02-19",
    titleRo: "Operatiuni Admin extinse + audit mai clar",
    titleEn: "Extended Admin operations + clearer audit",
    itemsRo: [
      "Setarile admin includ acum unelte operationale pentru backup/export/import, smoke run si versiuni cu rollback.",
      "A fost adaugata zona de audit/trash in panoul admin pentru trasabilitate si restaurare rapida.",
      "Audit log-ul afiseaza acum diferential pe campuri (inainte/dupa), nu snapshot complet la fiecare modificare.",
      "Fluxurile destructive folosesc confirmare securizata cu text + parola administratorului.",
    ],
    itemsEn: [
      "Admin settings now include operational tools for backup/export/import, smoke run and versioned rollback.",
      "A dedicated audit/trash area was added in admin for traceability and fast restore flows.",
      "Audit log now renders field-level diffs (before/after), not full snapshots on every change.",
      "Destructive flows now use secured confirmation with text + admin password.",
    ],
  },
  {
    version: "v0.49.0-admin",
    date: "2026-02-19",
    titleRo: "Badge-uri colorate pentru statusuri in Admin",
    titleEn: "Color-coded status badges in Admin",
    itemsRo: [
      "Statusurile de job si aplicatie din Admin folosesc acum badge-uri semantice, nu un singur stil neutru.",
      "Etichetele localizate + culorile permit evaluarea rapida a pipeline-ului fara a deschide fiecare intrare.",
    ],
    itemsEn: [
      "Job and application statuses in Admin now use semantic badges instead of one neutral style.",
      "Localized labels + colors enable quick pipeline evaluation without opening every entry.",
    ],
  },
  {
    version: "v0.48.0-admin",
    date: "2026-02-19",
    titleRo: "Statusuri aplicatii si statusuri job afisate prietenos",
    titleEn: "Friendly display for application and job statuses",
    itemsRo: [
      "In Admin, statusurile de aplicatii si joburi sunt afisate cu etichete lizibile in locul valorilor enum brute.",
      "Filtrele si select-urile de status folosesc aceeasi nomenclatura vizuala consistenta.",
    ],
    itemsEn: [
      "In Admin, application and job statuses are now displayed with readable labels instead of raw enum values.",
      "Status filters and selects now use the same consistent visual naming.",
    ],
  },
  {
    version: "v0.47.0-admin",
    date: "2026-02-19",
    titleRo: "Review wording ajustat + pagina View pentru companii",
    titleEn: "Review wording fix + dedicated company View page",
    itemsRo: [
      "Textul pentru nota de moderare job a fost corectat din 'pentru candidat' in formulare orientata spre angajator.",
      "Admin > Companii are acum actiune Vezi (View) care deschide pagina dedicata /admin/companies/[id].",
      "Pagina de detaliu companie afiseaza date complete + joburile companiei cu acces rapid la review/edit job.",
    ],
    itemsEn: [
      "Job moderation note wording was corrected from 'for candidate' to employer-oriented phrasing.",
      "Admin > Companies now includes a View action that opens dedicated /admin/companies/[id] page.",
      "Company detail page now shows full company data + company jobs with quick access to job review/edit.",
    ],
  },
  {
    version: "v0.46.0-admin",
    date: "2026-02-19",
    titleRo: "Curatare companii candidate + pending review pe pagina dedicata job",
    titleEn: "Candidate-company cleanup + pending review on dedicated job page",
    itemsRo: [
      "Companiile detinute de candidati au fost eliminate, iar pagina Admin > Companii afiseaza doar companii de angajatori (sau nealocate).",
      "In Admin > Joburi, sectiunea de pending review este acum un tabel cu acces direct la pagina de detaliu job.",
      "Aprobarea / respingerea la moderare se face acum din /admin/jobs/[id], unde sunt afisate toate detaliile relevante.",
    ],
    itemsEn: [
      "Candidate-owned companies were removed, and Admin > Companies now shows only employer-owned (or unassigned) companies.",
      "In Admin > Jobs, pending review is now a table with direct access to each job details page.",
      "Moderation approve/reject actions are now handled from /admin/jobs/[id], where full job details are available.",
    ],
  },
  {
    version: "v0.45.0-admin",
    date: "2026-02-19",
    titleRo: "Notificare email decizie review job + badge pending in meniu",
    titleEn: "Job review decision email + pending badge in menu",
    itemsRo: [
      "Dupa moderare job (aprobare/respinge in draft), owner-ul primeste email din template dedicat JOB_REVIEW_DECISION.",
      "Sidebar-ul Admin afiseaza badge pe Joburi cu numarul de anunturi aflate in status PENDING_REVIEW.",
      "Editorul de email template include acum intrarea Job Review Decision cu placeholders dedicate.",
    ],
    itemsEn: [
      "After job moderation (approve/reject to draft), the owner receives an email from dedicated JOB_REVIEW_DECISION template.",
      "Admin sidebar now shows a badge on Jobs with the number of listings in PENDING_REVIEW status.",
      "Email template editor now includes Job Review Decision entry with dedicated placeholders.",
    ],
  },
  {
    version: "v0.44.0-admin",
    date: "2026-02-19",
    titleRo: "Moderare pentru categorii propuse de companii",
    titleEn: "Moderation for company-suggested categories",
    itemsRo: [
      "Admin > Categorii include acum un inbox de propuneri venite de la companii (status PENDING).",
      "Propunerile pot fi aprobate (categoria se creeaza automat daca nu exista) sau respinse, cu nota de moderare optionala.",
      "Meniul Admin afiseaza badge pe linkul Categorii cu numarul de propuneri in asteptare.",
    ],
    itemsEn: [
      "Admin > Categories now includes an inbox for company suggestions (PENDING status).",
      "Suggestions can be approved (category auto-created if missing) or rejected, with optional moderation note.",
      "Admin menu now shows a badge on Categories link with the number of pending suggestions.",
    ],
  },
  {
    version: "v0.43.0-admin",
    date: "2026-02-19",
    titleRo: "Zone admin dedicate pentru candidat si angajator",
    titleEn: "Dedicated admin zones for candidate and employer",
    itemsRo: [
      "Sidebar-ul Admin include acum grupuri dedicate pentru fluxurile Candidat si Angajator.",
      "Linkurile dedicate folosesc filtre preselectate (users/jobs/companies/applications) pentru context imediat pe rol.",
      "Active-state-ul din meniul admin a fost extins pentru linkuri cu query params, astfel pagina curenta ramane evidenta corect.",
    ],
    itemsEn: [
      "Admin sidebar now includes dedicated groups for Candidate and Employer flows.",
      "Dedicated links use preselected filters (users/jobs/companies/applications) for immediate role-focused context.",
      "Admin menu active-state now supports query-param links so current-page highlighting stays accurate.",
    ],
  },
  {
    version: "v0.42.0-admin",
    date: "2026-02-19",
    titleRo: "Confirmari explicite pentru stergeri",
    titleEn: "Explicit confirmations for delete actions",
    itemsRo: [
      "Actiunile de stergere din Admin (joburi, companii, categorii, media assets) cer acum confirmare inainte de submit.",
      "Fluxul reduce stergerile accidentale in operatiunile curente de moderare si administrare.",
    ],
    itemsEn: [
      "Delete actions in Admin (jobs, companies, categories, media assets) now require confirmation before submit.",
      "This reduces accidental deletions during daily moderation and administration flows.",
    ],
  },
  {
    version: "v0.41.0-admin",
    date: "2026-02-19",
    titleRo: "Jurnal erori mutat in Configurare",
    titleEn: "Error logs moved under Configuration",
    itemsRo: [
      "Link-ul Jurnal erori a fost mutat din Acces & Utilizatori in Configurare.",
      "In meniul admin, Jurnal erori este afisat deasupra paginii Release Notes.",
    ],
    itemsEn: [
      "Error logs link was moved from Access & Users to Configuration.",
      "In admin menu, Error logs is now displayed above Release Notes.",
    ],
  },
  {
    version: "v0.40.0-admin",
    date: "2026-02-19",
    titleRo: "Test SMTP din setari + jurnal centralizat de erori",
    titleEn: "SMTP test from settings + centralized error logs",
    itemsRo: [
      "Tab-ul Integrari include acum un formular dedicat pentru trimiterea unui email de proba (SMTP test).",
      "A fost adaugata pagina /admin/errors pentru monitorizarea erorilor runtime raportate de utilizatori.",
      "Breadcrumbs si navigatia admin includ noua sectiune de jurnal erori.",
    ],
    itemsEn: [
      "Integrations tab now includes a dedicated form for sending a SMTP test email.",
      "A new /admin/errors page was added to monitor runtime errors reported by users.",
      "Admin breadcrumbs and navigation now include the new error log section.",
    ],
  },
  {
    version: "v0.39.0-admin",
    date: "2026-02-19",
    titleRo: "Paginare Release Notes + meniu Setari repozitionat",
    titleEn: "Release Notes pagination + repositioned Settings menu",
    itemsRo: [
      "Pagina Admin Release Notes foloseste acum paginare (15 intrari/pagina) cu Previous/Next.",
      "In sidebar, Setari este mutat deasupra Release Notes in categoria Configurare.",
      "Setari revine la link principal, iar subcategoriile se extind optional din buton dedicat.",
    ],
    itemsEn: [
      "Admin Release Notes page now uses pagination (15 entries/page) with Previous/Next.",
      "In sidebar, Settings is now placed above Release Notes under Configuration.",
      "Settings is back as a primary link, while subcategories expand optionally from a dedicated toggle.",
    ],
  },
  {
    version: "v0.38.0-admin",
    date: "2026-02-19",
    titleRo: "Meniu Setari rafinat vizual",
    titleEn: "Refined visual Settings menu",
    itemsRo: [
      "Submeniul Setari din sidebar are acum layout compact si coerent, cu subcategorii una sub alta si icon-uri clare.",
      "Navigarea in sectiunile de configurare este mai lizibila, cu highlight activ simplificat.",
    ],
    itemsEn: [
      "Settings submenu in sidebar now uses a compact, consistent layout with stacked icon-based subcategories.",
      "Navigation across configuration sections is clearer with simplified active highlighting.",
    ],
  },
  {
    version: "v0.37.0-admin",
    date: "2026-02-19",
    titleRo: "Setari in accordion + switch limba template instant",
    titleEn: "Settings accordion + instant template language switch",
    itemsRo: [
      "Meniul Setari din sidebar foloseste acum accordion custom (expand/collapse), fara dropdown-ul vechi.",
      "In Email Templates, schimbarea limbii RO/EN actualizeaza continutul imediat, fara refresh manual.",
    ],
    itemsEn: [
      "Settings menu in sidebar now uses a custom expand/collapse accordion instead of old dropdown.",
      "In Email Templates, switching RO/EN updates content instantly without manual refresh.",
    ],
  },
  {
    version: "v0.36.0-admin",
    date: "2026-02-19",
    titleRo: "Template-uri email pe limba (RO/EN)",
    titleEn: "Per-language email templates (RO/EN)",
    itemsRo: [
      "Email Templates suporta acum editare separata pe limba RO/EN pentru fiecare tip de mesaj.",
      "Sistemul trimite automat varianta de template conform limbii preferate a utilizatorului.",
    ],
    itemsEn: [
      "Email Templates now support separate RO/EN editing for each message type.",
      "System now sends template variant automatically based on user preferred language.",
    ],
  },
  {
    version: "v0.35.0-admin",
    date: "2026-02-19",
    titleRo: "Fix selectie template + drag & drop in Media",
    titleEn: "Template selection fix + drag & drop in Media",
    itemsRo: [
      "Email Templates afiseaza acum corect continutul la schimbarea template-ului selectat.",
      "Media Library suporta drag & drop pentru upload rapid, pe langa selectia clasica de fisier.",
    ],
    itemsEn: [
      "Email Templates now correctly updates content when switching the selected template.",
      "Media Library now supports drag & drop uploads in addition to classic file selection.",
    ],
  },
  {
    version: "v0.34.0-admin",
    date: "2026-02-19",
    titleRo: "Template-uri email optimizate pentru editare si flux",
    titleEn: "Email templates optimized for editing and flow",
    itemsRo: [
      "Editorul afiseaza denumiri user-friendly + descriere si placeholders specifice pentru fiecare template.",
      "La salvare se pastreaza template-ul activ in URL (tpl), pentru editare rapida fara reset pe primul item.",
    ],
    itemsEn: [
      "Editor now shows user-friendly labels + descriptions and per-template placeholders.",
      "Saving now preserves active template in URL (tpl) for fast editing without resetting to first item.",
    ],
  },
  {
    version: "v0.33.0-admin",
    date: "2026-02-19",
    titleRo: "Editor template email fara scroll lung",
    titleEn: "Email templates editor without long scrolling",
    itemsRo: [
      "Pagina Email Templates foloseste acum selectie pe template (stanga) + editor dedicat pentru un singur template.",
      "Editarea este mai rapida, iar URL-ul retine template-ul activ prin query param tpl.",
    ],
    itemsEn: [
      "Email Templates page now uses template selector (left) + dedicated editor for a single template.",
      "Editing is faster and URL keeps active template via tpl query param.",
    ],
  },
  {
    version: "v0.32.0-admin",
    date: "2026-02-19",
    titleRo: "Media Library + Email Templates administrabile",
    titleEn: "Admin-managed Media Library + Email Templates",
    itemsRo: [
      "A fost adaugata sectiunea Media Library in Settings, cu upload, listare si selectie pentru favicon.",
      "A fost adaugata sectiunea Email Templates in Settings pentru editarea template-urilor automate (welcome, job nou, aplicari, mesaje).",
    ],
    itemsEn: [
      "A new Media Library section was added in Settings, with upload, listing, and favicon selection support.",
      "A new Email Templates section was added in Settings to edit automated templates (welcome, new job, applications, messages).",
    ],
  },
  {
    version: "v0.31.0-admin",
    date: "2026-02-19",
    titleRo: "Traduceri impartite pe categorii",
    titleEn: "Translations organized by categories",
    itemsRo: [
      "Pagina de traduceri din admin are acum filtrare pe categorii (nav, common, home, jobs, admin etc.).",
      "Editorul permite cautare + lucru pe sectiune dedicata, cu numar de chei pe fiecare categorie.",
    ],
    itemsEn: [
      "Admin translations page now supports category-based filtering (nav, common, home, jobs, admin, etc.).",
      "Editor now combines text search with category-focused editing and per-category key counts.",
    ],
  },
  {
    version: "v0.30.0-admin",
    date: "2026-02-19",
    titleRo: "Setari in meniu ierarhic + pagina separata pentru traduceri",
    titleEn: "Hierarchical settings menu + dedicated translations page",
    itemsRo: [
      "Meniul admin are acum sectiune Setari cu subcategorii: Setari platforma si Traduceri.",
      "Editorul de traduceri a fost mutat pe ruta separata /admin/settings/translations pentru un flux mai clar.",
    ],
    itemsEn: [
      "Admin menu now includes a Settings section with subcategories: Platform settings and Translations.",
      "Translation editor was moved to dedicated route /admin/settings/translations for a cleaner workflow.",
    ],
  },
  {
    version: "v0.29.0-admin",
    date: "2026-02-19",
    titleRo: "Analytics pe zi aliniat la timezone-ul platformei",
    titleEn: "Per-day analytics aligned to platform timezone",
    itemsRo: [
      "Dashboard-ul admin calculeaza acum zilele din analytics folosind defaultTimezone din Settings, nu UTC brut.",
      "A fost eliminata decalarea de o zi in graficele Published/Applications observata in apropierea schimbarii de zi.",
    ],
    itemsEn: [
      "Admin dashboard now computes analytics day buckets using Settings defaultTimezone instead of raw UTC.",
      "Fixed one-day shift in Published/Applications charts observed around day boundaries.",
    ],
  },
  {
    version: "v0.28.0-admin",
    date: "2026-02-19",
    titleRo: "Management traduceri in Settings",
    titleEn: "Translation management in Settings",
    itemsRo: [
      "Admin Settings include acum editor de traduceri pe chei (RO/EN) cu cautare si override-uri.",
      "Setarile platformei includ limba implicita (default locale) pentru vizitatori fara preferinta salvata.",
    ],
    itemsEn: [
      "Admin Settings now include a key-based translation editor (RO/EN) with search and overrides.",
      "Platform settings now include default locale for visitors without a saved preference.",
    ],
  },
  {
    version: "v0.27.0-admin",
    date: "2026-02-18",
    titleRo: "Breadcrumbs globale in Admin Panel",
    titleEn: "Global breadcrumbs in Admin Panel",
    itemsRo: [
      "Layout-ul admin afiseaza breadcrumbs pe toate paginile, cu icoane pe fiecare nivel.",
      "Navigarea catre sectiunile admin este mai rapida datorita traseului clickabil din header.",
    ],
    itemsEn: [
      "Admin layout now shows breadcrumbs on all pages, with icons for each level.",
      "Navigation between admin sections is faster via the clickable header path.",
    ],
  },
  {
    version: "v0.26.0-admin",
    date: "2026-02-18",
    titleRo: "Filtre live in aplicatiile din detaliu job",
    titleEn: "Live filters for job-detail applications",
    itemsRo: [
      "In /admin/jobs/[id], aplicatiile au acum filtre live dupa status, CV source si cautare nume/email.",
      "Header-ul sectiunii afiseaza contor rezultate filtrate vs total pentru triere rapida.",
    ],
    itemsEn: [
      "In /admin/jobs/[id], applications now support live filters by status, CV source, and name/email search.",
      "Section header now shows filtered-vs-total count for quick triage.",
    ],
  },
  {
    version: "v0.25.0-admin",
    date: "2026-02-18",
    titleRo: "Aplicatii job in detaliu admin + CV snapshot",
    titleEn: "Job-level admin applications + CV snapshot",
    itemsRo: [
      "Pagina /admin/jobs/[id] include acum lista de aplicatii pentru jobul curent.",
      "Fiecare aplicatie afiseaza CV source, CV snapshot (daca exista), conversatii si note interne.",
    ],
    itemsEn: [
      "Page /admin/jobs/[id] now includes applications list for the current job.",
      "Each application now shows CV source, CV snapshot (when available), conversations, and internal notes.",
    ],
  },
  {
    version: "v0.24.0-admin",
    date: "2026-02-18",
    titleRo: "Editor WYSIWYG in management joburi + sanitizare rich text",
    titleEn: "WYSIWYG in job management + rich text sanitization",
    itemsRo: [
      "Creare/Editare job in admin foloseste editor WYSIWYG avansat pentru sumar si descriere.",
      "Continutul rich text este sanitizat la salvare pentru securitate si consistenta.",
    ],
    itemsEn: [
      "Admin create/edit job now uses an advanced WYSIWYG editor for summary and description.",
      "Rich text content is sanitized on save for security and consistency.",
    ],
  },
  {
    version: "v0.23.0-admin",
    date: "2026-02-18",
    titleRo: "CV source/snapshot in spy mode + editor rich text in create job",
    titleEn: "CV source/snapshot in spy mode + rich text editor in create job",
    itemsRo: [
      "Aplicatiile din admin afiseaza acum sursa CV (profil vs upload/link).",
      "Spy mode include snapshot-ul CV din profil la momentul aplicarii, cand este disponibil.",
      "Modalul de creare job din admin foloseste editor rich text pentru sumar si descriere.",
    ],
    itemsEn: [
      "Admin applications now show CV source (profile vs upload/link).",
      "Spy mode now includes profile CV snapshot captured at application time when available.",
      "Admin create-job modal now uses rich text editor fields for summary and description.",
    ],
  },
  {
    version: "v0.22.0-admin",
    date: "2026-02-18",
    titleRo: "Setari noi functionale pentru dashboard si homepage",
    titleEn: "New functional settings for dashboard and homepage",
    itemsRo: [
      "A fost adaugata setarea pentru numarul de joburi recomandate afisate pe homepage.",
      "A fost adaugata setarea pentru filtrul implicit Posted in pagina /jobs.",
      "Setarile sunt conectate runtime si aplicate imediat in UI-ul public.",
    ],
    itemsEn: [
      "Added setting for featured jobs count displayed on homepage.",
      "Added setting for default Posted filter on /jobs page.",
      "Settings are wired at runtime and applied immediately in public UI.",
    ],
  },
  {
    version: "v0.21.0-admin",
    date: "2026-02-18",
    titleRo: "Interval implicit configurabil pentru statistici admin",
    titleEn: "Configurable default range for admin analytics",
    itemsRo: [
      "Dashboard-ul admin foloseste acum implicit intervalul de 7 zile.",
      "A fost adaugata setare in Admin Settings pentru interval implicit statistici: 7/30/90 zile.",
      "Selectia manuala din URL continua sa aiba prioritate fata de default-ul configurat.",
    ],
    itemsEn: [
      "Admin dashboard now defaults to a 7-day analytics range.",
      "A new Admin Settings option was added for default analytics range: 7/30/90 days.",
      "Manual range selection from URL still overrides the configured default.",
    ],
  },
  {
    version: "v0.20.0-admin",
    date: "2026-02-18",
    titleRo: "Inbox dropdown outside-click close",
    titleEn: "Inbox dropdown outside-click close",
    itemsRo: [
      "Quick inbox dropdown din header se inchide acum la click/touch in afara zonei.",
    ],
    itemsEn: [
      "Header quick inbox dropdown now closes on outside click/touch.",
    ],
  },
  {
    version: "v0.19.0-admin",
    date: "2026-02-18",
    titleRo: "Inbox bell dropdown and workspace nav active-state fix (Admin)",
    titleEn: "Inbox bell dropdown and workspace nav active-state fix (Admin)",
    itemsRo: [
      "A fost extins header-ul cu quick inbox dropdown pentru ultimele conversatii, inclusiv indicator de necitite.",
      "Sincronizarea active-route pentru meniul workspace a fost corectata prin migrare la client-side pathname.",
      "A fost remediata incompatibilitatea Prisma Client aparuta dupa migrare (regen complet cu engine local).",
    ],
    itemsEn: [
      "Header was extended with a quick inbox dropdown for latest conversations, including unread indicators.",
      "Workspace menu active-route sync was fixed by moving to client-side pathname tracking.",
      "Prisma Client mismatch after migration was resolved via full regenerate using local engine.",
    ],
  },
  {
    version: "v0.18.0-admin",
    date: "2026-02-18",
    titleRo: "Automations, deployment guide, and admin notes (Admin)",
    titleEn: "Automations, deployment guide, and admin notes (Admin)",
    itemsRo: [
      "A fost adaugata pagina dedicata Admin Release Notes accesibila doar din panelul admin.",
      "Scriptul release:bump actualizeaza acum automat atat changelog-ul public, cat si cel intern admin.",
      "A fost introdus setup automat pentru taskul Daily Digest in Task Scheduler (script separat).",
      "Endpoint intern de healthcheck si loguri structurate cu request-id pentru observabilitate operationala.",
      "Spy mode pentru aplicatii in admin include acum pipeline, conversatii si note interne in mod read-only.",
    ],
    itemsEn: [
      "A dedicated Admin Release Notes page was added and is available only inside the admin panel.",
      "The release:bump script now updates both public and internal admin changelogs automatically.",
      "Automatic Daily Digest Task Scheduler setup was added via a separate script.",
      "A healthcheck endpoint and structured request-id logging were added for operational observability.",
      "Admin spy mode for applications now includes pipeline, conversations, and internal notes in read-only mode.",
    ],
  },
  {
    version: "v0.17.0-admin",
    date: "2026-02-18",
    titleRo: "Audit intern, verificare companii si control operational",
    titleEn: "Internal audit, company verification, and operational controls",
    itemsRo: [
      "Companiile au status de verificare (pending/verified) si pot fi verificate direct din admin.",
      "A fost introdus audit trail pentru actiuni sensibile: suspendare/reactivare/verificare companii, approve/reject job.",
      "Dashboard-ul admin include acum sectiune dedicata de audit recent.",
      "A fost adaugat endpoint intern pentru digest zilnic al aplicarilor catre owneri.",
      "Housekeeping curata si datele istorice de unique views pe baza retention policy.",
    ],
    itemsEn: [
      "Companies now have verification status (pending/verified) and can be verified directly from admin.",
      "Audit trail was added for sensitive actions: company suspend/reactivate/verify and job approve/reject.",
      "Admin dashboard now includes a dedicated recent audit section.",
      "A private internal endpoint was added for daily owner application digests.",
      "Housekeeping now also cleans historical unique-view data based on retention policy.",
    ],
  },
  {
    version: "v0.16.0-admin",
    date: "2026-02-18",
    titleRo: "Setari tabbed si meniu admin reorganizat",
    titleEn: "Tabbed settings and reorganized admin menu",
    itemsRo: [
      "Setarile admin au fost refacute in tab-uri tematice pentru navigare mai rapida.",
      "Meniul admin a fost reorganizat pe categorii operationale, cu icon-uri.",
      "Modul de creare job din admin a fost mutat in modal pentru flux mai curat.",
    ],
    itemsEn: [
      "Admin settings were rebuilt into themed tabs for faster navigation.",
      "Admin menu was reorganized into operational groups with icons.",
      "Admin job creation was moved to a modal for a cleaner flow.",
    ],
  },
];














































