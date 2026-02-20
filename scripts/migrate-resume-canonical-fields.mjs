import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const workPreferenceAliases = {
  remote: "REMOTE",
  hibrid: "HYBRID",
  hybrid: "HYBRID",
  "la birou": "ONSITE",
  "on-site": "ONSITE",
  onsite: "ONSITE",
};

const availabilityAliases = {
  imediat: "IMMEDIATELY",
  immediately: "IMMEDIATELY",
  "2 saptamani": "TWO_WEEKS",
  "2 weeks": "TWO_WEEKS",
  "1 luna": "ONE_MONTH",
  "1 month": "ONE_MONTH",
};

const workAuthorizationAliases = {
  "drept de munca in ro": "WORK_AUTH_RO",
  "work authorized in ro": "WORK_AUTH_RO",
  "drept de munca in ue": "WORK_AUTH_EU",
  "work authorized in eu": "WORK_AUTH_EU",
  "necesita sponsorship": "REQUIRES_SPONSORSHIP",
  "requires sponsorship": "REQUIRES_SPONSORSHIP",
};

function normalize(value, aliases) {
  if (!value) {
    return null;
  }
  const key = value.trim().toLowerCase();
  return aliases[key] || value;
}

async function run() {
  const resumes = await prisma.resume.findMany({
    select: {
      id: true,
      workPreference: true,
      availability: true,
      workAuthorization: true,
    },
  });

  let updated = 0;
  for (const resume of resumes) {
    const nextWorkPreference = normalize(resume.workPreference, workPreferenceAliases);
    const nextAvailability = normalize(resume.availability, availabilityAliases);
    const nextWorkAuthorization = normalize(resume.workAuthorization, workAuthorizationAliases);

    if (
      nextWorkPreference !== resume.workPreference ||
      nextAvailability !== resume.availability ||
      nextWorkAuthorization !== resume.workAuthorization
    ) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          workPreference: nextWorkPreference,
          availability: nextAvailability,
          workAuthorization: nextWorkAuthorization,
        },
      });
      updated += 1;
    }
  }

  console.log(`Scanned resumes: ${resumes.length}`);
  console.log(`Updated resumes: ${updated}`);
}

run()
  .catch((error) => {
    console.error("Resume canonical migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
