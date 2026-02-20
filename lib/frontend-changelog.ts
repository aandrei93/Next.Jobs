export const FRONTEND_VERSION = "v0.65.0";

export type FrontendChangelogEntry = {
  version: string;
  date: string;
  titleRo: string;
  titleEn: string;
  itemsRo: string[];
  itemsEn: string[];
};

export const frontendChangelog: FrontendChangelogEntry[] = [
  {
    version: "v0.65.0",
    date: "2026-02-20",
    titleRo: "Animatii globale la scroll + fix hydration mismatch",
    titleEn: "Global scroll animations + hydration mismatch fix",
    itemsRo: [
      "Animatia de reveal la scroll este aplicata acum global pe pagini, pentru incarcare vizuala progresiva a sectiunilor.",
      "Implementarea globala a fost facuta hydration-safe, fara mutatii de atribute SSR inainte de hidratarea React.",
      "Homepage-ul pastreaza varianta premium de reveal pe sectiuni, sincronizata cu noul comportament global.",
    ],
    itemsEn: [
      "Scroll-reveal animation is now applied globally across pages for progressive section loading.",
      "Global implementation is now hydration-safe, without SSR attribute mutations before React hydration.",
      "Homepage keeps the premium section-based reveal style, aligned with the new global behavior.",
    ],
  },
  {
    version: "v0.64.0",
    date: "2026-02-19",
    titleRo: "Aplicare job: UX mai clar pentru candidati/vizitatori",
    titleEn: "Job apply: clearer UX for candidates/visitors",
    itemsRo: [
      "Formularul de aplicare diferentiaza mai clar fluxul pentru candidat autentificat vs vizitator.",
      "Afisarea starii aplicarii si a regulilor de trimitere este mai predictibila in zona utilizatorului.",
      "Corectii de stabilitate pe fluxul de aplicare pentru a evita cazurile cu payload invalid.",
    ],
    itemsEn: [
      "Application form now clearly separates authenticated-candidate vs visitor flow.",
      "Application status and submission rules are now more predictable in user-facing areas.",
      "Stability fixes were applied to reduce invalid-payload cases in apply flow.",
    ],
  },
  {
    version: "v0.63.0",
    date: "2026-02-19",
    titleRo: "Badge-uri semantice pentru statusuri in aplicatii/joburi",
    titleEn: "Semantic badges for status display in applications/jobs",
    itemsRo: [
      "Statusurile aplicatiilor si joburilor au acum culori semantice (verde, amber, rosu, albastru) pentru citire rapida.",
      "Am pastrat etichetele localizate si am adaugat stil vizual consistent in zonele candidat si angajator.",
    ],
    itemsEn: [
      "Application and job statuses now use semantic colors (green, amber, red, blue) for faster scanning.",
      "Localized labels were kept and visual consistency was added across candidate and employer areas.",
    ],
  },
  {
    version: "v0.62.0",
    date: "2026-02-19",
    titleRo: "Statusuri aplicatii afisate user-friendly",
    titleEn: "Application statuses shown in user-friendly format",
    itemsRo: [
      "Statusurile aplicatiilor (NEW, SCREENING, INTERVIEW, etc.) sunt acum afisate cu etichete curate in zonele candidat/angajator.",
      "Dropdown-urile de actualizare status folosesc aceleasi etichete lizibile, nu valori brute de enum.",
    ],
    itemsEn: [
      "Application statuses (NEW, SCREENING, INTERVIEW, etc.) are now displayed with clean labels in candidate/employer areas.",
      "Status update dropdowns now use the same readable labels instead of raw enum values.",
    ],
  },
  {
    version: "v0.61.0",
    date: "2026-02-19",
    titleRo: "Localizare completa pentru sugestia de categorie din Joburile mele",
    titleEn: "Full localization for category suggestion in My Jobs",
    itemsRo: [
      "Textele noi din fluxul de propunere categorie din Joburile mele au fost mutate in dictionarul de traduceri.",
      "UI-ul foloseste acum chei localizate pentru titlu, descriere, placeholder, buton si mesajul fara rezultate.",
    ],
    itemsEn: [
      "New texts from the category suggestion flow in My Jobs were moved to the translation dictionary.",
      "UI now uses localized keys for title, description, placeholder, button, and empty-state message.",
    ],
  },
  {
    version: "v0.60.0",
    date: "2026-02-19",
    titleRo: "Propunere categorie direct din formularul de job",
    titleEn: "Category suggestion directly from job form",
    itemsRo: [
      "In Spatiul Angajatorului > Joburile mele, sectiunea de categorie include acum propunere rapida de categorie noua.",
      "Angajatorul poate trimite propunerea fara a parasi formularul de creare job.",
      "Sub formular sunt afisate ultimele propuneri cu statusul lor (PENDING, APPROVED, REJECTED).",
    ],
    itemsEn: [
      "In Employer Workspace > My jobs, the category section now includes a quick new-category suggestion action.",
      "Employers can submit a suggestion without leaving the job creation form.",
      "Latest suggestions are displayed below with their status (PENDING, APPROVED, REJECTED).",
    ],
  },
  {
    version: "v0.59.0",
    date: "2026-02-19",
    titleRo: "Propuneri de categorii din partea companiilor",
    titleEn: "Company-driven category proposals",
    itemsRo: [
      "In Spatiul Angajatorului (Companiile mele) a fost adaugata sectiunea de propunere categorie noua.",
      "Angajatorii pot trimite nume + context pentru o categorie, iar propunerile apar cu status (PENDING/APPROVED/REJECTED).",
      "Companiile suspendate nu pot trimite propuneri noi, in linie cu restrictiile de publicare joburi.",
    ],
    itemsEn: [
      "A new category suggestion section was added in Employer Workspace (My companies).",
      "Employers can submit category name + context, and proposals are shown with status (PENDING/APPROVED/REJECTED).",
      "Suspended companies cannot submit new suggestions, aligned with job posting restrictions.",
    ],
  },
  {
    version: "v0.58.0",
    date: "2026-02-19",
    titleRo: "Badge aprobare companii in meniul Admin",
    titleEn: "Company approval badge in Admin menu",
    itemsRo: [
      "Sidebar-ul Admin afiseaza acum un badge pe linkul Companii cu numarul de companii aflate in asteptare la aprobare.",
      "Badge-ul este calculat dinamic din baza de date (verificationStatus = PENDING_VERIFICATION).",
    ],
    itemsEn: [
      "Admin sidebar now shows a badge on Companies link with the number of companies pending approval.",
      "Badge value is computed dynamically from database (verificationStatus = PENDING_VERIFICATION).",
    ],
  },
  {
    version: "v0.57.0",
    date: "2026-02-19",
    titleRo: "Fix active-state Admin + rol EMPLOYER",
    titleEn: "Admin active-state fix + EMPLOYER role",
    itemsRo: [
      "Rutele /admin/users si /admin/applications au din nou ancore explicite in meniu, cu highlight corect.",
      "Meniul Admin ramane curat: vederea generala este separata de zonele dedicate Candidate/Employer.",
      "Sistemul de roluri include acum explicit EMPLOYER (alaturi de ADMIN si CANDIDATE).",
      "Conturile employer noi primesc automat rol EMPLOYER, iar conturile existente au fost sincronizate din accountType.",
    ],
    itemsEn: [
      "/admin/users and /admin/applications now have explicit menu anchors with correct active highlighting.",
      "Admin menu stays clean: general view is separated from dedicated Candidate/Employer zones.",
      "Role system now explicitly includes EMPLOYER (alongside ADMIN and CANDIDATE).",
      "New employer accounts now get EMPLOYER role automatically, and existing accounts were backfilled from accountType.",
    ],
  },
  {
    version: "v0.56.0",
    date: "2026-02-19",
    titleRo: "Fix navigare activa in Workspace si cleanup meniu Admin",
    titleEn: "Workspace active-nav fix and Admin menu cleanup",
    itemsRo: [
      "Meniul din /me foloseste acum active-state exact pe ruta curenta, fara dublu-highlight la Sumar.",
      "In Admin sidebar au fost eliminate dublurile de navigare pentru Aplicatii/Utilizatori din grupul general.",
      "Fluxurile pentru Aplicatii/Utilizatori raman disponibile doar in zonele dedicate Candidat/Angajator.",
    ],
    itemsEn: [
      "The /me menu now uses exact current-route active state, removing Overview double-highlighting.",
      "Admin sidebar duplicate Applications/Users links were removed from the generic section.",
      "Applications/Users flows remain available only under dedicated Candidate/Employer zones.",
    ],
  },
  {
    version: "v0.55.0",
    date: "2026-02-19",
    titleRo: "Profil companie extins + cleanup employer CV",
    titleEn: "Extended company profile + employer CV cleanup",
    itemsRo: [
      "Formularul de companie include acum campuri concrete: Nr. inregistrare, CUI/VAT, Industrie, Marime companie, An infiintare.",
      "Datele noi de companie se pot crea si edita direct din Workspace > Companiile mele.",
      "Sectiunea CV a fost scoasa din fluxul angajatorului, iar ruta /me/employer/resume redirectioneaza catre profil.",
      "Pe pagina de verificare email, mesajul de succes confirma explicit trimiterea emailului de bun venit.",
    ],
    itemsEn: [
      "Company form now includes concrete fields: Registration number, VAT/Tax ID, Industry, Company size, Founded year.",
      "New company details can be created and edited directly from Workspace > My companies.",
      "CV section was removed from employer flow, and /me/employer/resume now redirects to profile.",
      "On email verification page, success message now explicitly confirms that welcome email was sent.",
    ],
  },
  {
    version: "v0.54.0",
    date: "2026-02-19",
    titleRo: "Employer fara CV + register error UX + welcome dupa verificare",
    titleEn: "Employer without CV + register error UX + welcome after verification",
    itemsRo: [
      "Fluxul Employer nu mai afiseaza sectiunea CV in workspace; ruta /me/employer/resume redirectioneaza catre profil.",
      "Formularul de inregistrare pastreaza acum valorile la eroare si afiseaza erori traduse pe campuri (RO/EN).",
      "Email-ul de bun venit se trimite dupa verificarea adresei de email, nu imediat dupa inregistrare.",
      "Formularul de adaugare/editare companie cere acum descriere mai concreta (minim 60 caractere) si include ghidaj clar pentru completare.",
    ],
    itemsEn: [
      "Employer flow no longer exposes CV section in workspace; /me/employer/resume now redirects to profile.",
      "Registration form now keeps values on error and shows localized field-level errors (RO/EN).",
      "Welcome email is now sent after email verification, not immediately after registration.",
      "Company create/edit form now requires a more concrete description (minimum 60 characters) and includes clearer completion guidance.",
    ],
  },
  {
    version: "v0.53.0",
    date: "2026-02-19",
    titleRo: "Badge de rol in header",
    titleEn: "Role badge in header",
    itemsRo: [
      "Utilizatorii autentificati vad acum un badge clar in header pentru tipul contului (Candidat / Angajator).",
      "Etichetele badge-ului sunt localizate complet in RO/EN prin sistemul de traduceri.",
    ],
    itemsEn: [
      "Authenticated users now see a clear header badge for account type (Candidate / Employer).",
      "Badge labels are fully localized in RO/EN through the translation system.",
    ],
  },
  {
    version: "v0.52.0",
    date: "2026-02-19",
    titleRo: "Access denied + cleanup linkuri legacy",
    titleEn: "Access denied + legacy link cleanup",
    itemsRo: [
      "A fost adaugata pagina /me/access-denied pentru mesaje clare de acces pe rol nepotrivit.",
      "Guard-urile candidate/employer trimit acum in Access denied in loc de redirect silentios catre alt dashboard.",
      "Linkurile UI catre inbox folosesc acum rutele noi pe rol (/me/candidate/*, /me/employer/*), fara legacy in navigare.",
    ],
    itemsEn: [
      "A dedicated /me/access-denied page was added for clear role-mismatch access messages.",
      "Candidate/employer guards now point to Access denied instead of silent redirects to another dashboard.",
      "UI inbox links now use role routes (/me/candidate/*, /me/employer/*) with no legacy navigation usage.",
    ],
  },
  {
    version: "v0.51.0",
    date: "2026-02-19",
    titleRo: "Redirect-uri legacy Workspace catre rutele pe rol",
    titleEn: "Legacy Workspace redirects to role routes",
    itemsRo: [
      "Rutele vechi /me/profile, /me/resume, /me/applications redirectioneaza acum catre /me si apoi pe ruta rolului.",
      "Rutele vechi /me/jobs si /me/companies redirectioneaza catre fluxul employer dedicat.",
      "Noile rute /me/candidate/* si /me/employer/* ruleaza direct, fara re-export din paginile legacy.",
    ],
    itemsEn: [
      "Legacy routes /me/profile, /me/resume, /me/applications now redirect to /me and then role-specific routes.",
      "Legacy /me/jobs and /me/companies now redirect to the dedicated employer flow.",
      "New /me/candidate/* and /me/employer/* routes now run directly, without legacy page re-exports.",
    ],
  },
  {
    version: "v0.50.0",
    date: "2026-02-19",
    titleRo: "Rute dedicate Candidate/Employer in Workspace",
    titleEn: "Dedicated Candidate/Employer workspace routes",
    itemsRo: [
      "Ruta /me redirectioneaza automat in functie de cont catre /me/candidate sau /me/employer.",
      "Sidebar-ul Workspace foloseste acum navigare dedicata pe rol, cu link-uri separate pe fiecare profil.",
      "Actiunile de creare job/companie sunt protejate strict la nivel server pentru conturi employer.",
    ],
    itemsEn: [
      "The /me route now auto-redirects by account type to /me/candidate or /me/employer.",
      "Workspace sidebar now uses role-dedicated navigation with separate links per profile.",
      "Job/company creation actions are now strictly protected at server level for employer accounts.",
    ],
  },
  {
    version: "v0.49.0",
    date: "2026-02-19",
    titleRo: "Workspace separat pe roluri + homepage premium",
    titleEn: "Role-based workspace split + premium homepage",
    itemsRo: [
      "Workspace-ul diferentiaza acum clar fluxurile pentru Candidat vs Angajator (meniuri si sectiuni dedicate).",
      "Accesul la creare joburi/companii este blocat la nivel server pentru conturi non-employer (protectie hard, nu doar UI).",
      "Pagina principala si paginile auth folosesc acum imagini reale cu pozitionare smart desktop/mobile pentru un aspect mai premium.",
    ],
    itemsEn: [
      "Workspace now clearly separates Candidate vs Employer flows with dedicated sections and navigation.",
      "Job/company creation is now hard-blocked at server level for non-employer accounts (not just hidden in UI).",
      "Homepage and auth pages now use real photography with smart desktop/mobile positioning for a more premium look.",
    ],
  },
  {
    version: "v0.48.0",
    date: "2026-02-19",
    titleRo: "Flux nou de inregistrare + confirmari la stergere",
    titleEn: "New registration flow + delete confirmations",
    itemsRo: [
      "Pagina /register este acum hub de selectie, iar inregistrarea este separata pe /register/employee si /register/employer.",
      "Paginile de autentificare/inregistrare au layout modernizat, cu card central si ierarhie vizuala mai clara.",
      "Actiunile de eliminare din Saved Jobs si stergerea companiilor din zona utilizator cer acum confirmare explicita.",
    ],
    itemsEn: [
      "The /register page is now a selection hub, with dedicated flows at /register/employee and /register/employer.",
      "Login/register pages were refreshed with a centered card layout and clearer visual hierarchy.",
      "Saved Jobs removal and company deletion in user workspace now require explicit confirmation.",
    ],
  },
  {
    version: "v0.47.0",
    date: "2026-02-19",
    titleRo: "Auth pages restilizate + modul Privacy",
    titleEn: "Restyled auth pages + Privacy module",
    itemsRo: [
      "Header-ul si footer-ul au fost reintroduse pe login/register, eliminand efectul de flicker.",
      "Register are acum layout tip selector Candidat/Angajator in zona hero, inspirat din design-ul de referinta.",
      "A fost adaugat modul de privacy cu popup de consimtamant (Accept all / Reject all / Save & exit) si pagina publica /privacy.",
      "Fluxul Ai uitat parola / Reset parola foloseste acum acelasi stil vizual modern ca restul paginilor auth.",
    ],
    itemsEn: [
      "Header and footer were restored on login/register, removing the previous flicker effect.",
      "Register now uses a Candidate/Employer hero selector layout inspired by the provided reference design.",
      "A privacy consent module was added (Accept all / Reject all / Save & exit) along with a public /privacy page.",
      "Forgot password / Reset password flow now follows the same modern visual style as other auth pages.",
    ],
  },
  {
    version: "v0.46.0",
    date: "2026-02-19",
    titleRo: "Fix hydration auth + selector vizual tip cont",
    titleEn: "Auth hydration fix + visual account type selector",
    itemsRo: [
      "A fost eliminat warning-ul de hydration mismatch pe paginile auth prin sincronizarea controlata a clasei de chrome.",
      "Selectorul tipului de cont din register foloseste acum card-uri vizuale (Candidat/Angajat) cu descrieri scurte.",
    ],
    itemsEn: [
      "Hydration mismatch warning on auth pages was resolved by controlled chrome class synchronization.",
      "Registration account type selector now uses visual cards (Candidate/Employer) with short descriptions.",
    ],
  },
  {
    version: "v0.45.0",
    date: "2026-02-19",
    titleRo: "Auth redesign + register simplificat",
    titleEn: "Auth redesign + simplified registration",
    itemsRo: [
      "Paginile Login/Register au layout nou full-screen cu background dedicat si card extins.",
      "Chrome-ul global (header/footer/breadcrumbs) este acum ascuns fara flicker pe refresh pentru /login si /register.",
      "Formularul de inregistrare a fost simplificat la: tip cont (candidat/angajat), nume complet, email, parola, nationalitate, data nasterii.",
    ],
    itemsEn: [
      "Login/Register pages now use a new full-screen layout with dedicated background and larger form card.",
      "Global chrome (header/footer/breadcrumbs) is now hidden without refresh flicker for /login and /register.",
      "Registration form was simplified to: account type (candidate/employer), full name, email, password, nationality, birth date.",
    ],
  },
  {
    version: "v0.44.0",
    date: "2026-02-19",
    titleRo: "Pagini auth fara header/footer + register extins",
    titleEn: "Auth pages without header/footer + extended registration",
    itemsRo: [
      "Paginile de login si inregistrare ruleaza acum in mod single-page, fara header/footer global.",
      "Formularul de inregistrare include campuri suplimentare utile (titlu, oras, cetatenie, data nasterii, sex, website, LinkedIn).",
      "Footer-ul public nu mai afiseaza link-ul catre Admin, iar link-ul de Login este ascuns pentru utilizatorii autentificati.",
    ],
    itemsEn: [
      "Login and register pages now run in single-page mode without global header/footer.",
      "Registration form now includes additional useful fields (title, city, citizenship, birth date, gender, website, LinkedIn).",
      "Public footer no longer shows Admin link, and Login link is hidden for authenticated users.",
    ],
  },
  {
    version: "v0.43.0",
    date: "2026-02-19",
    titleRo: "Captura automata erori runtime",
    titleEn: "Automatic runtime error capture",
    itemsRo: [
      "Erorile runtime neasteptate din UI sunt raportate automat catre backend pentru monitorizare.",
      "Utilizatorii vad acum un fallback clar cu optiune Retry atunci cand apare o eroare globala.",
    ],
    itemsEn: [
      "Unexpected runtime UI errors are now automatically reported to backend monitoring.",
      "Users now see a clear fallback with Retry action when a global error occurs.",
    ],
  },
  {
    version: "v0.42.0",
    date: "2026-02-19",
    titleRo: "Paginare in Frontend Release Notes",
    titleEn: "Frontend Release Notes pagination",
    itemsRo: [
      "Pagina publica de release notes afiseaza acum 15 intrari pe pagina.",
      "Navigarea intre pagini se face prin controale Previous/Next folosind query param-ul page.",
    ],
    itemsEn: [
      "Public release notes page now shows 15 entries per page.",
      "Page navigation now uses Previous/Next controls powered by the page query parameter.",
    ],
  },
  {
    version: "v0.41.0",
    date: "2026-02-19",
    titleRo: "Emailuri automate localizate dupa preferinta utilizatorului",
    titleEn: "Automated emails localized by user preference",
    itemsRo: [
      "Emailurile automate folosesc acum varianta RO/EN in functie de limba preferata a utilizatorului.",
      "Preferinta de limba este sincronizata la schimbarea limbii din switch-ul site-ului.",
    ],
    itemsEn: [
      "Automated emails now use RO/EN variant based on user preferred language.",
      "Language preference is synchronized when users change language from the site switcher.",
    ],
  },
  {
    version: "v0.40.0",
    date: "2026-02-19",
    titleRo: "Favicon din Media Library + emailuri automate pe template",
    titleEn: "Favicon from Media Library + template-driven automated emails",
    itemsRo: [
      "Favicon-ul site-ului poate fi selectat din Media Library direct din Admin Settings.",
      "Emailurile automate (bun venit, job nou, aplicari noi, mesaje noi) folosesc acum template-uri administrabile.",
    ],
    itemsEn: [
      "Site favicon can now be selected from Media Library directly in Admin Settings.",
      "Automated emails (welcome, new job, new applications, new messages) now use admin-manageable templates.",
    ],
  },
  {
    version: "v0.39.0",
    date: "2026-02-19",
    titleRo: "Categorii traduceri rafinate",
    titleEn: "Refined translation categories",
    itemsRo: [
      "Cheile localeName si localeSwitchLabel sunt acum grupate impreuna in categoria Limba & selector.",
      "Ordinea categoriilor din Admin Translations este stabilizata pentru navigare mai rapida.",
    ],
    itemsEn: [
      "localeName and localeSwitchLabel keys are now grouped together under Locale & switch category.",
      "Admin Translations category ordering is now stabilized for faster navigation.",
    ],
  },
  {
    version: "v0.38.0",
    date: "2026-02-19",
    titleRo: "Protectie email in footer",
    titleEn: "Footer email protection",
    itemsRo: [
      "Adresa de email din footer nu mai este randata in clar in HTML, fiind obfuscata inainte de afisare.",
      "Email-ul este dezvaluit doar la actiunea utilizatorului prin buton dedicat, pentru a reduce scraping-ul automat.",
    ],
    itemsEn: [
      "Footer email is no longer rendered as plain text in HTML and is obfuscated before display.",
      "Email is revealed only after explicit user action via a dedicated button to reduce automated scraping.",
    ],
  },
  {
    version: "v0.37.0",
    date: "2026-02-19",
    titleRo: "Toast-uri localizate complet",
    titleEn: "Fully localized toast notifications",
    itemsRo: [
      "Titlurile toast-urilor si eticheta butonului de inchidere sunt acum localizate RO/EN.",
      "Toate textele noi introduse pentru notificari au fost mutate in dictionarele i18n.",
    ],
    itemsEn: [
      "Toast titles and close-button label are now localized for RO/EN.",
      "All newly introduced notification texts were moved into i18n dictionaries.",
    ],
  },
  {
    version: "v0.36.0",
    date: "2026-02-19",
    titleRo: "Notificari toast redesenate",
    titleEn: "Redesigned toast notifications",
    itemsRo: [
      "Toasts de succes/eroare au design nou cu icon, stil vizual dedicat si animatie de progres.",
      "Notificarile pot fi inchise manual si se ascund automat dupa un interval scurt.",
    ],
    itemsEn: [
      "Success/error toasts now use a new visual style with icon, dedicated status colors, and progress animation.",
      "Notifications can be dismissed manually and auto-hide after a short delay.",
    ],
  },
  {
    version: "v0.35.0",
    date: "2026-02-19",
    titleRo: "Sistem de limba administrabil + limba implicita din setari",
    titleEn: "Admin-managed language system + settings default locale",
    itemsRo: [
      "Limba implicita pentru vizitatori noi este acum configurabila din Admin Settings.",
      "Dictionarele publice aplica override-uri de traducere salvate din Admin, pe fiecare cheie.",
    ],
    itemsEn: [
      "Default language for new visitors is now configurable from Admin Settings.",
      "Public dictionaries now apply translation overrides saved from Admin per key.",
    ],
  },
  {
    version: "v0.34.0",
    date: "2026-02-18",
    titleRo: "Breadcrumbs cu icon-uri in frontend",
    titleEn: "Icon-based breadcrumbs on frontend",
    itemsRo: [
      "A fost adaugat breadcrumbs global in frontend pentru rutele publice si workspace.",
      "Breadcrumbs nu apar pe home, auth, admin sau API, pentru o interfata mai curata.",
    ],
    itemsEn: [
      "A global breadcrumbs component was added for public and workspace routes.",
      "Breadcrumbs are hidden on home, auth, admin, and API routes for a cleaner interface.",
    ],
  },
  {
    version: "v0.33.0",
    date: "2026-02-18",
    titleRo: "Migrare canonica CV pentru consistenta multi-limba",
    titleEn: "Canonical CV migration for cross-language consistency",
    itemsRo: [
      "Valorile vechi din CV pentru Work preference, Availability si Work authorization au fost migrate la coduri canonice.",
      "Datele deja salvate raman afisate corect dupa schimbarea limbii, fara re-completare manuala.",
    ],
    itemsEn: [
      "Legacy CV values for Work preference, Availability, and Work authorization were migrated to canonical codes.",
      "Previously saved data now remains stable across language switches without manual re-entry.",
    ],
  },
  {
    version: "v0.32.0",
    date: "2026-02-18",
    titleRo: "Editor WYSIWYG avansat + fix CV cross-language",
    titleEn: "Advanced WYSIWYG editor + cross-language CV fix",
    itemsRo: [
      "Formularele de job folosesc acum editor WYSIWYG avansat (toolbar complet: headings, liste, link, quote, undo/redo).",
      "Continutul joburilor este sanitizat la salvare si afisat in format rich text in pagina de detalii.",
      "Campurile CV de tip selectie (Work preference, Availability, Work authorization) folosesc valori canonice, astfel nu se mai golesc dupa schimbarea limbii.",
    ],
    itemsEn: [
      "Job forms now use an advanced WYSIWYG editor (full toolbar: headings, lists, links, quote, undo/redo).",
      "Job content is sanitized on save and rendered as rich text in job details pages.",
      "CV select fields (Work preference, Availability, Work authorization) now use canonical values, so they no longer reset after language switch.",
    ],
  },
  {
    version: "v0.31.0",
    date: "2026-02-18",
    titleRo: "Aplicare cu CV din profil + editor rich text la joburi",
    titleEn: "Apply with profile CV + rich text editor for job forms",
    itemsRo: [
      "Aplicarea la job permite acum alegerea intre CV din profil si upload/link CV.",
      "Cand se foloseste CV din profil, aplicatia salveaza un snapshot al CV-ului la momentul aplicarii.",
      "Formularele de creare job folosesc editor rich text pentru sumar si descriere completa.",
    ],
    itemsEn: [
      "Job applications now support choosing between profile CV and uploaded/linked CV.",
      "When profile CV is used, the application stores a CV snapshot at application time.",
      "Job creation forms now use rich text editor fields for summary and full description.",
    ],
  },
  {
    version: "v0.30.0",
    date: "2026-02-18",
    titleRo: "Homepage si Jobs controlate din setari",
    titleEn: "Homepage and Jobs now controlled from settings",
    itemsRo: [
      "Numarul de joburi afisate pe homepage este acum controlat din setarile platformei.",
      "Pagina /jobs poate porni implicit cu un filtru Posted configurabil (Oricand/24h/7z/30z).",
      "Comportamentul implicit se aplica doar cand utilizatorul nu selecteaza explicit un alt filtru.",
    ],
    itemsEn: [
      "Homepage jobs count is now controlled from platform settings.",
      "/jobs page can now start with a configurable default Posted filter (Any/24h/7d/30d).",
      "The default behavior is applied only when users do not explicitly choose another filter.",
    ],
  },
  {
    version: "v0.29.0",
    date: "2026-02-18",
    titleRo: "Hardening sesiuni NextAuth",
    titleEn: "NextAuth session hardening",
    itemsRo: [
      "Configurarea auth foloseste explicit secretul (AUTH_SECRET/NEXTAUTH_SECRET) pentru consistenta JWT.",
      "getCurrentSession este fail-safe si returneaza null daca apare eroare de decriptare a sesiunii.",
      "Documentatia de mediu include AUTH_SECRET pentru aliniere cu naming-ul nou Auth.js.",
    ],
    itemsEn: [
      "Auth configuration now explicitly uses secret (AUTH_SECRET/NEXTAUTH_SECRET) for JWT consistency.",
      "getCurrentSession is now fail-safe and returns null on session decryption errors.",
      "Environment docs now include AUTH_SECRET for alignment with newer Auth.js naming.",
    ],
  },
  {
    version: "v0.28.0",
    date: "2026-02-18",
    titleRo: "Data nasterii in profil si CV",
    titleEn: "Date of birth in profile and CV",
    itemsRo: [
      "Campul Varsta a fost inlocuit cu Data nasterii (zi/luna/an) in profil.",
      "Datele personale importante (cetatenie, locatie, sex, data nasterii) sunt afisate si in preview-ul CV.",
      "Datele sunt persistate corect in baza de date si validate in backend.",
    ],
    itemsEn: [
      "Age field was replaced with Date of birth (day/month/year) in profile.",
      "Important personal details (citizenship, location, sex, date of birth) are now shown in CV preview.",
      "Data is persisted correctly in the database and validated in backend.",
    ],
  },
  {
    version: "v0.27.0",
    date: "2026-02-18",
    titleRo: "Profil extins cu date personale esentiale",
    titleEn: "Profile expanded with essential personal details",
    itemsRo: [
      "Profilul utilizator include acum cetatenie, locatie, varsta si sex.",
      "Campurile sunt salvate end-to-end si validate in backend.",
      "Formularul de profil a fost adaptat pentru completare mai clara a datelor de baza.",
    ],
    itemsEn: [
      "User profile now includes citizenship, location, age, and sex.",
      "Fields are persisted end-to-end with backend validation.",
      "Profile form was adapted for clearer completion of core personal details.",
    ],
  },
  {
    version: "v0.26.0",
    date: "2026-02-18",
    titleRo: "CV ajustat pentru piata locala + security checklist live",
    titleEn: "CV adjusted for local market + live security checklist",
    itemsRo: [
      "In CV builder au fost eliminate sectiunile certificari/proiecte/realizari si inlocuite cu permis de conducere si hobby-uri/interese.",
      "Fiecare camp din CV are acum descriere explicita pentru completare corecta.",
      "Formularul de securitate foloseste iconita ochi in input-uri de parola si checklist live cu bife pentru forta parolei.",
    ],
    itemsEn: [
      "CV builder removed certifications/projects/achievements and replaced them with driving license and hobbies/interests.",
      "Each CV field now includes explicit helper text for correct completion.",
      "Security form now uses eye icons inside password inputs and a live checkbox-style password strength checklist.",
    ],
  },
  {
    version: "v0.25.0",
    date: "2026-02-18",
    titleRo: "CV extins cu sectiuni esentiale si descrieri",
    titleEn: "CV expanded with essential sections and field guidance",
    itemsRo: [
      "Builder-ul CV include acum sectiuni cheie: certificari, proiecte, realizari si work authorization.",
      "Fiecare camp din builder are descriere scurta despre scop si cum sa fie completat.",
      "Preview-ul live si preview-ul din profil includ noile date relevante pentru recrutori.",
    ],
    itemsEn: [
      "CV builder now includes key sections: certifications, projects, achievements, and work authorization.",
      "Each CV field now includes a short helper description explaining purpose and completion style.",
      "Both live preview and profile preview now include the new recruiter-relevant information.",
    ],
  },
  {
    version: "v0.24.0",
    date: "2026-02-18",
    titleRo: "Profil securitate si CV preview sincronizat",
    titleEn: "Profile security and synced CV preview",
    itemsRo: [
      "Preview-ul CV din /me/profile este acum sincronizat dupa update-ul din builder.",
      "In Security ai acum optiune de afisare/ascundere parola in formular.",
      "A fost adaugat indicator de putere pentru parola noua in profil.",
    ],
    itemsEn: [
      "CV preview in /me/profile is now synced after updates from the CV builder.",
      "Security form now includes show/hide password toggle.",
      "A password strength indicator was added for the new password field.",
    ],
  },
  {
    version: "v0.23.0",
    date: "2026-02-18",
    titleRo: "Credentiale cont in profil",
    titleEn: "Account credentials in profile",
    itemsRo: [
      "In /me/profile a fost adaugata sectiunea Security pentru schimbare parola direct din cont.",
      "Schimbarea emailului de login este acum disponibila din profil, cu verificare pe noul email.",
      "Modificarile de credentiale cer parola curenta si afiseaza feedback clar pentru erori/succes.",
    ],
    itemsEn: [
      "A new Security section in /me/profile now allows direct password changes from account settings.",
      "Changing the login email is now available in profile, with verification sent to the new email address.",
      "Credential updates require current password and now show clear success/error feedback.",
    ],
  },
  {
    version: "v0.22.0",
    date: "2026-02-18",
    titleRo: "CV live preview si campuri extinse",
    titleEn: "CV live preview and extended fields",
    itemsRo: [
      "Build CV are acum preview live fara save, actualizat instant in partea dreapta.",
      "Au fost adaugate campuri noi: telefon, preferinta de lucru, disponibilitate, salariu dorit, ani experienta, limbi.",
      "Formularul CV este restructurat pe blocuri mai utile pentru recrutori.",
    ],
    itemsEn: [
      "Build CV now includes live preview without save, updating instantly on the right panel.",
      "New fields were added: phone, work preference, availability, expected salary, years of experience, languages.",
      "The CV form was restructured into recruiter-friendly sections.",
    ],
  },
  {
    version: "v0.21.0",
    date: "2026-02-18",
    titleRo: "CV Builder redesign si inbox polish",
    titleEn: "CV Builder redesign and inbox polish",
    itemsRo: [
      "Pagina Build CV a fost reorganizata in sectiuni clare (profil, prezentare, experienta/studii) cu preview lateral.",
      "A fost adaugat indicator de completare profil in header-ul paginii CV.",
      "Dropdown-ul de notificari are acum animatie de aparitie/disparitie si badge explicit pentru mesaje noi.",
    ],
    itemsEn: [
      "Build CV page was reorganized into clear sections (profile, overview, experience/education) with side preview.",
      "A profile completion indicator was added in the CV page header.",
      "Notifications dropdown now has enter/exit animation and an explicit new-messages badge.",
    ],
  },
  {
    version: "v0.20.0",
    date: "2026-02-18",
    titleRo: "Inbox dropdown behavior polish",
    titleEn: "Inbox dropdown behavior polish",
    itemsRo: [
      "Dropdown-ul de notificari din header se inchide acum automat la click in afara zonei sale.",
      "Pe mobil, dropdown-ul se inchide corect si la touch in afara.",
    ],
    itemsEn: [
      "Header notifications dropdown now closes automatically when clicking outside its area.",
      "On mobile, the dropdown now also closes correctly on outside touch.",
    ],
  },
  {
    version: "v0.19.0",
    date: "2026-02-18",
    titleRo: "Inbox bell dropdown and workspace nav active-state fix",
    titleEn: "Inbox bell dropdown and workspace nav active-state fix",
    itemsRo: [
      "Clopotelul din header este acum clickabil si afiseaza dropdown cu ultimele 5 conversatii din aplicatii.",
      "Fiecare item din dropdown arata indicator de necitit, preview mesaj, companie si timestamp.",
      "Sidebar-ul din /me a fost mutat pe componenta client pentru active state corect la navigare fara refresh.",
      "Meniul de workspace include icon-uri consistente si highlight vizual pentru pagina curenta.",
      "Meniul mobil din header ramane disponibil, iar inbox-ul rapid este accesibil direct din dropdown.",
    ],
    itemsEn: [
      "Header bell is now clickable and shows a dropdown with the latest 5 application conversations.",
      "Each dropdown item now includes unread indicator, message preview, company, and timestamp.",
      "The /me sidebar was moved to a client component so active state updates correctly without refresh.",
      "Workspace navigation now uses consistent icons and clear visual highlight for the current page.",
      "Mobile header menu remains available, and quick inbox access is now reachable directly from dropdown.",
    ],
  },
  {
    version: "v0.18.0",
    date: "2026-02-18",
    titleRo: "Automations, deployment guide, and admin notes",
    titleEn: "Automations, deployment guide, and admin notes",
    itemsRo: [
      "Flux nou de securitate cont: verificare email la inregistrare, recuperare parola si reset parola prin token.",
      "Sesiunile utilizatorului pot fi invalidate global (logout pe toate device-urile) din profil.",
      "Pagina de aplicatii din workspace include pipeline complet, conversatii recruiter-candidat si note interne.",
      "Search local imbunatatit fara costuri externe: sinonime + scorare relevanta in lista de joburi.",
      "Homepage a fost extinsa cu sectiuni noi orientate pe conversie (How it works, Hiring pulse, CTA final).",
      "README a fost refacut cu instructiuni complete de deploy si automatizari (housekeeping/digest/release).",
    ],
    itemsEn: [
      "New account security flow: email verification on signup, forgot password, and token-based password reset.",
      "Users can now invalidate all sessions at once (logout all devices) from profile settings.",
      "Workspace applications now include full pipeline stages, recruiter-candidate conversation, and internal notes.",
      "Improved local search with zero external cost: synonym expansion plus relevance scoring in jobs list.",
      "Homepage was expanded with conversion-focused sections (How it works, Hiring pulse, final CTA).",
      "README was rebuilt with complete deployment and automation instructions (housekeeping/digest/release).",
    ],
  },
  {
    version: "v0.17.0",
    date: "2026-02-18",
    titleRo: "Vizualizari unice, trust signals si SEO pentru joburi",
    titleEn: "Unique views, trust signals, and job SEO improvements",
    itemsRo: [
      "Vizualizarile joburilor sunt acum unice per vizitator/utilizator, nu cresc la refresh.",
      "Formularele de aplicare au protectii anti-spam (honeypot + blocare domenii email temporare).",
      "Companiile trebuie verificate inainte sa poata publica joburi in workspace.",
      "Paginile de job includ metadata social dinamica si schema JobPosting (JSON-LD) pentru indexare mai buna.",
      "Aplicatiile zilnice pot fi trimise in digest email pentru ownerii care activeaza optiunea.",
    ],
    itemsEn: [
      "Job views are now unique per visitor/user and no longer increase on page refresh.",
      "Application forms now include anti-spam protection (honeypot + disposable email domain blocking).",
      "Companies must be verified before they can post jobs from workspace.",
      "Job pages now include dynamic social metadata and JobPosting schema (JSON-LD) for better indexing.",
      "Daily application digest emails can be sent to owners who enable this preference.",
    ],
  },
  {
    version: "v0.16.0",
    date: "2026-02-18",
    titleRo: "Upload CV si automatizari platforma",
    titleEn: "CV upload and platform automations",
    itemsRo: [
      "Aplicarea la job suporta upload direct pentru CV cu validari de dimensiune si tip fisier.",
      "Joburile expirate sunt tratate automat pentru a mentine listarea publica curata.",
      "Evenimentele de aplicare si creare job ruleaza notificari automate.",
    ],
    itemsEn: [
      "Job application flow now supports direct CV upload with size and file-type validation.",
      "Expired jobs are handled automatically to keep public listings clean.",
      "Application and job creation events now trigger automated notifications.",
    ],
  },
  {
    version: "v0.15.0",
    date: "2026-02-18",
    titleRo: "Reguli publice de calitate si experienta",
    titleEn: "Public quality and experience rules",
    itemsRo: [
      "Rate limiting pe login/register/apply este activ pe IP.",
      "Regulile de aplicare (CV obligatoriu, mesaj minim, anti-duplicate) sunt aplicate runtime.",
      "Keyword moderation si prag minim de descriere job sunt aplicate la creare/editare.",
      "Feature flags pentru Saved Jobs si Resume Builder sunt conectate in navigare si pagini.",
      "Sitemap este generat conditionat de setare, iar canonical/OG fallback sunt configurabile.",
      "Notificarile automate sunt declansate la evenimente cheie din fluxul de joburi.",
    ],
    itemsEn: [
      "IP-based rate limiting is active for login/register/apply.",
      "Application rules (required CV, minimum message, anti-duplicate) are enforced at runtime.",
      "Keyword moderation and minimum job description thresholds are enforced on create/edit.",
      "Feature flags for Saved Jobs and Resume Builder are wired into navigation and pages.",
      "Sitemap generation is setting-driven, and canonical/OG fallback are configurable.",
      "Automated notifications are triggered on key job flow events.",
    ],
  },
  {
    version: "v0.14.0",
    date: "2026-02-18",
    titleRo: "Maintenance API lock si dropdown monede",
    titleEn: "Maintenance API lock and currency dropdowns",
    itemsRo: [
      "In maintenance mode, endpoint-urile API publice din aplicatie sunt blocate pentru utilizatorii non-admin.",
      "Moneda este acum selectabila din dropdown (EUR, USD, RON) in setari si formularele de job.",
      "Validarea backend pentru moneda foloseste lista stricta de coduri suportate.",
    ],
    itemsEn: [
      "In maintenance mode, public application API endpoints are blocked for non-admin users.",
      "Currency is now selected via dropdown (EUR, USD, RON) in settings and job forms.",
      "Backend currency validation now enforces a strict list of supported currency codes.",
    ],
  },
  {
    version: "v0.13.0",
    date: "2026-02-18",
    titleRo: "Setari globale functionale end-to-end",
    titleEn: "End-to-end functional global settings",
    itemsRo: [
      "Maintenance Mode este acum aplicat global pentru utilizatorii publici, cu mesaj dedicat si email suport.",
      "Setarea SEO Noindex controleaza robots metadata pentru site.",
      "Google Analytics Measurement ID activeaza scriptul de tracking in layout.",
      "Tagline si datele de contact din Settings sunt propagate in homepage/footer.",
    ],
    itemsEn: [
      "Maintenance Mode is now enforced globally for public users, with dedicated message and support email.",
      "SEO Noindex now controls site-level robots metadata.",
      "Google Analytics Measurement ID now injects tracking script in layout.",
      "Settings tagline and contact details are now propagated to homepage/footer.",
    ],
  },
  {
    version: "v0.12.0",
    date: "2026-02-18",
    titleRo: "Configurari platforma pentru launch",
    titleEn: "Launch-ready platform settings",
    itemsRo: [
      "Inregistrarea publica poate fi activata/dezactivata global din setari.",
      "Moneda implicita si expirarea implicita a joburilor sunt acum configurabile.",
      "Fluxul de postare job pentru utilizatori poate publica automat sau in draft, in functie de configurare.",
    ],
    itemsEn: [
      "Public registration can now be enabled or disabled globally from settings.",
      "Default currency and default job expiration are now configurable.",
      "User job posting can now auto-publish or stay draft based on platform configuration.",
    ],
  },
  {
    version: "v0.11.0",
    date: "2026-02-18",
    titleRo: "Branding nou si social cards",
    titleEn: "New branding and social cards",
    itemsRo: [
      "Logo nou NextJobs integrat in header, footer si favicon.",
      "OG image si Twitter image generate dinamic pentru share pe retelele sociale.",
      "Workspace > My Jobs afiseaza mesaj explicit de suspendare companie si contact suport.",
    ],
    itemsEn: [
      "New NextJobs logo integrated in header, footer and favicon.",
      "Dynamic Open Graph and Twitter images were added for social sharing.",
      "Workspace > My Jobs now shows an explicit suspended-company message and support contact.",
    ],
  },
  {
    version: "v0.10.4",
    date: "2026-02-18",
    titleRo: "Inbox aplicatii pentru owner si views joburi",
    titleEn: "Owner applications inbox and job views",
    itemsRo: [
      "Workspace > Applications include inbox separat pentru aplicatiile primite la joburile utilizatorului.",
      "Vizualizarile joburilor sunt urmarite in timp real pe experienta publica de listare si detalii.",
      "Postarea joburilor din workspace foloseste doar companii active (nesuspendate).",
    ],
    itemsEn: [
      "Workspace > Applications now includes a separate inbox for applications received on the user's jobs.",
      "Job views are tracked in real time on the public listing and details experience.",
      "Workspace job posting uses only active (not suspended) companies.",
    ],
  },
  {
    version: "v0.10.3",
    date: "2026-02-18",
    titleRo: "Aplicatii primite si reguli companii active",
    titleEn: "Received applications and active company rules",
    itemsRo: [
      "Workspace > Applications include acum si sectiunea «Aplicatii primite la joburile mele».",
      "Publicarea joburilor din workspace este permisa doar pentru companii active (nesuspendate).",
      "Mesajele din fluxul de postare clarifica blocarea atunci cand nu exista companie activa.",
    ],
    itemsEn: [
      "Workspace > Applications now includes a new «Applications received for my jobs» section.",
      "Workspace job posting is allowed only for active (not suspended) companies.",
      "Posting flow messages now clarify lock state when no active company is available.",
    ],
  },
  {
    version: "v0.10.2",
    date: "2026-02-18",
    titleRo: "Release Notes curate pentru utilizatori",
    titleEn: "User-facing release notes cleanup",
    itemsRo: [
      "Release Notes afiseaza doar modificari accesibile utilizatorilor.",
      "Modificarile interne de Admin Panel au fost excluse din lista publica.",
    ],
    itemsEn: [
      "Release Notes now show only user-accessible changes.",
      "Internal Admin Panel updates were removed from the public list.",
    ],
  },
  {
    version: "v0.10.1",
    date: "2026-02-18",
    titleRo: "Fixuri UI generale",
    titleEn: "General UI fixes",
    itemsRo: [
      "Corectii de text/encoding in interfata publica pentru separatoare.",
      "Ajustari vizuale pentru consistenta componentelor reutilizabile.",
    ],
    itemsEn: [
      "Text/encoding corrections in public UI separators.",
      "Visual consistency adjustments for shared UI components.",
    ],
  },
  {
    version: "v0.10.0",
    date: "2026-02-18",
    titleRo: "Release Notes publice si flux companii",
    titleEn: "Public release notes and company flow",
    itemsRo: [
      "Pagina publica de changelog a fost transformata in Frontend Release Notes.",
      "Footer-ul afiseaza versiunea frontend curenta si link catre release notes.",
      "Workspace include My Companies dedicat (create/edit/delete, suport logo URL).",
      "Blocare postare job pana la adaugarea unei companii proprii.",
      "Autocomplete pentru locatii in formularele principale de job/companie.",
      "Corectie caractere corupte in UI pentru separatoare text.",
    ],
    itemsEn: [
      "Public changelog page was refocused into Frontend Release Notes.",
      "Footer now shows the current frontend version and release notes link.",
      "Workspace now includes dedicated My Companies (create/edit/delete, logo URL support).",
      "Job posting can be locked until users add their own company.",
      "Location autocomplete added in main job/company forms.",
      "Corrupted UI separator characters were fixed.",
    ],
  },
  {
    version: "v0.9.0",
    date: "2026-02-18",
    titleRo: "Platform UX refresh",
    titleEn: "Platform UX refresh",
    itemsRo: [
      "Pagina Jobs in format master-detail: lista stanga + continut job dreapta fara refresh.",
      "Filtre extinse: oras, tip angajare, posted, seniority, categorii.",
      "Control vizual nou pentru detalii: Job Details tabelar + actiuni in header.",
      "Footer public cu versiune si link catre changelog frontend.",
    ],
    itemsEn: [
      "Jobs page moved to master-detail: left list + right job content without refresh.",
      "Extended filters: city, employment type, posted, seniority, categories.",
      "New details visual: table-like Job Details + header actions.",
      "Public footer with version and frontend changelog link.",
    ],
  },
  {
    version: "v0.8.0",
    date: "2026-02-18",
    titleRo: "Homepage si identitate vizuala",
    titleEn: "Homepage and visual identity",
    itemsRo: [
      "Homepage redesenata cu sectiuni mai dense si preview live de joburi.",
      "Header language switch pe iconite cu tooltip pentru Romana/English.",
      "Buton flotant Scroll to top pentru navigare rapida.",
    ],
    itemsEn: [
      "Homepage redesigned with denser sections and live job preview.",
      "Header language switch moved to icon buttons with Romanian/English tooltip.",
      "Floating scroll-to-top button for faster navigation.",
    ],
  },
  {
    version: "v0.7.0",
    date: "2026-02-18",
    titleRo: "Workspace si publicare joburi",
    titleEn: "Workspace and job posting",
    itemsRo: [
      "Formulare Create Job refacute in sectiuni clare pentru workspace-ul utilizatorului.",
      "Reference Number generat automat, blocat la editare in UI.",
      "My Companies introdus in workspace pentru gestionare companii proprii.",
    ],
    itemsEn: [
      "Create Job forms rebuilt into clearer sections for user workspace.",
      "Reference Number is auto-generated and read-only in UI.",
      "My Companies introduced in workspace for managing owned companies.",
    ],
  },
];






































































