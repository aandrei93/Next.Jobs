import { PrismaClient, JobStatus, EmploymentType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@nextjobs.local";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Platform Admin",
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    create: {
      name: "Platform Admin",
      email: adminEmail,
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const companyInputs = [
    { name: "TechNova", location: "Bucharest, Romania" },
    { name: "Blue Orbit", location: "Cluj-Napoca, Romania" },
    { name: "GreenPulse Labs", location: "Timisoara, Romania" },
    { name: "Aurora Commerce", location: "Iasi, Romania" },
    { name: "Northbridge AI", location: "Brasov, Romania" },
    { name: "Riverstone Systems", location: "Sibiu, Romania" },
  ];

  const companies = [];
  for (const item of companyInputs) {
    const company = await prisma.company.upsert({
      where: { slug: slugify(item.name) },
      update: { location: item.location },
      create: {
        name: item.name,
        slug: slugify(item.name),
        location: item.location,
      },
    });
    companies.push(company);
  }

  const categoryNames = ["Engineering", "Product", "Design", "Data", "Marketing", "Sales"];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categories.push(category);
  }

  const titles = [
    "Senior Full-Stack Engineer",
    "Frontend React Engineer",
    "Backend Node.js Engineer",
    "Product Manager",
    "UI/UX Designer",
    "Data Analyst",
    "Data Engineer",
    "Marketing Specialist",
    "SEO Manager",
    "Sales Development Representative",
  ];

  const cities = ["Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Brasov", "Sibiu", "Remote EU"];
  const employmentTypes = [EmploymentType.FULL_TIME, EmploymentType.PART_TIME, EmploymentType.CONTRACT, EmploymentType.INTERNSHIP];

  for (let i = 1; i <= 50; i += 1) {
    const titleBase = titles[(i - 1) % titles.length];
    const city = cities[(i - 1) % cities.length];
    const company = companies[(i - 1) % companies.length];
    const category = categories[(i - 1) % categories.length];
    const employmentType = employmentTypes[(i - 1) % employmentTypes.length];
    const isRemote = city === "Remote EU" || i % 3 === 0;
    const salaryMin = 1400 + i * 70;
    const salaryMax = salaryMin + 900 + (i % 5) * 120;
    const viewsCount = 20 + i * 3;
    const slug = `${slugify(titleBase)}-${i}`;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30 + (i % 15));
    const referenceNumber = `#69${String(42000 + i).padStart(5, "0")}`;

    await prisma.job.upsert({
      where: { slug },
      update: {
        title: `${titleBase} ${i}`,
        summary: `Join ${company.name} and work on impactful product features with measurable outcomes.`,
        description:
          `As ${titleBase} ${i}, you will collaborate with cross-functional teams to design, build and improve core product capabilities.\n` +
          `- Build and iterate features with strong attention to quality\n` +
          `- Partner with product and design for roadmap delivery\n` +
          `- Improve performance, reliability and user experience\n` +
          `- Share knowledge with the team and document decisions`,
        location: city,
        isRemote,
        employmentType,
        salaryMin,
        salaryMax,
        viewsCount,
        currency: "EUR",
        expirationDate,
        referenceNumber,
        status: JobStatus.PUBLISHED,
        publishedAt: new Date(),
        companyId: company.id,
        categoryId: category.id,
        createdById: admin.id,
      },
      create: {
        title: `${titleBase} ${i}`,
        slug,
        summary: `Join ${company.name} and work on impactful product features with measurable outcomes.`,
        description:
          `As ${titleBase} ${i}, you will collaborate with cross-functional teams to design, build and improve core product capabilities.\n` +
          `- Build and iterate features with strong attention to quality\n` +
          `- Partner with product and design for roadmap delivery\n` +
          `- Improve performance, reliability and user experience\n` +
          `- Share knowledge with the team and document decisions`,
        location: city,
        isRemote,
        employmentType,
        salaryMin,
        salaryMax,
        viewsCount,
        currency: "EUR",
        expirationDate,
        referenceNumber,
        status: JobStatus.PUBLISHED,
        publishedAt: new Date(),
        companyId: company.id,
        categoryId: category.id,
        createdById: admin.id,
      },
    });
  }

  console.log("Seed completed.");
  console.log("Published jobs ensured: 50");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
