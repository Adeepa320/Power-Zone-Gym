/**
 * Seed script — creates the default admin and realistic sample data.
 *
 *   npm run seed            → admin + sample members, payments, attendance, workout plans
 *                             (re-running adds plans to sample members that have none)
 *   npm run seed:admin      → admin account only
 *   npm run seed -- --reset → wipe ALL collections first, then seed everything
 *
 * Default admin: admin@gym.com / admin123   (change the password after first login!)
 * Sample members: <firstname>@example.com / member123
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { addDays, startOfDay, subDays, subMonths } from 'date-fns';

config({ path: '.env.local' });
config();

import User from '../src/models/User';
import Payment from '../src/models/Payment';
import Attendance from '../src/models/Attendance';
import MemberWorkoutPlan from '../src/models/MemberWorkoutPlan';
import { parseWhatsAppPlan } from '../src/lib/workoutPlan';
import Settings from '../src/models/Settings';
import { GYM, MEMBERSHIP_PRICING } from '../src/lib/constants';

const args = new Set(process.argv.slice(2));
const ADMIN_ONLY = args.has('--admin-only');
const RESET = args.has('--reset');

// Deterministic PRNG so the sample data is the same on every run.
let seed = 42;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

type Category = 'normal' | 'cardio' | 'personal_training';

const SAMPLE_MEMBERS: {
  name: string;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  bodyType: string;
  goal: string;
  category: Category;
  monthsAgo: number;
  health?: string;
  attendanceRate: number;
}[] = [
  { name: 'Kasun Perera', gender: 'male', age: 27, weight: 78, height: 175, bodyType: 'Average', goal: 'Muscle gain', category: 'normal', monthsAgo: 5, attendanceRate: 0.75 },
  { name: 'Nimali Fernando', gender: 'female', age: 31, weight: 64, height: 162, bodyType: 'Average', goal: 'Weight loss', category: 'cardio', monthsAgo: 4, attendanceRate: 0.65 },
  { name: 'Tharindu Silva', gender: 'male', age: 23, weight: 68, height: 178, bodyType: 'Slim', goal: 'Muscle gain', category: 'personal_training', monthsAgo: 3, attendanceRate: 0.85 },
  { name: 'Dilini Jayasinghe', gender: 'female', age: 26, weight: 57, height: 158, bodyType: 'Slim', goal: 'General fitness', category: 'cardio', monthsAgo: 3, attendanceRate: 0.5 },
  { name: 'Ruwan Wickramasinghe', gender: 'male', age: 38, weight: 92, height: 172, bodyType: 'Overweight', goal: 'Weight loss', category: 'personal_training', monthsAgo: 2, health: 'Mild lower back pain — avoid heavy deadlifts', attendanceRate: 0.6 },
  { name: 'Sanduni Rathnayake', gender: 'female', age: 29, weight: 61, height: 165, bodyType: 'Athletic', goal: 'Strength', category: 'normal', monthsAgo: 6, attendanceRate: 0.7 },
  { name: 'Chamara Bandara', gender: 'male', age: 34, weight: 85, height: 180, bodyType: 'Muscular', goal: 'Strength', category: 'normal', monthsAgo: 6, attendanceRate: 0.8 },
  { name: 'Ishara Gunawardena', gender: 'female', age: 22, weight: 52, height: 160, bodyType: 'Slim', goal: 'Flexibility & mobility', category: 'cardio', monthsAgo: 1, attendanceRate: 0.45 },
  { name: 'Pradeep Kumara', gender: 'male', age: 45, weight: 88, height: 170, bodyType: 'Overweight', goal: 'General fitness', category: 'cardio', monthsAgo: 2, health: 'Controlled hypertension', attendanceRate: 0.4 },
  { name: 'Hasini Wijesekara', gender: 'female', age: 35, weight: 70, height: 168, bodyType: 'Average', goal: 'Endurance', category: 'personal_training', monthsAgo: 1, attendanceRate: 0.55 },
  { name: 'Lahiru Dissanayake', gender: 'male', age: 25, weight: 74, height: 176, bodyType: 'Athletic', goal: 'Muscle gain', category: 'normal', monthsAgo: 0, attendanceRate: 0.7 },
  { name: 'Thilini Senanayake', gender: 'female', age: 28, weight: 59, height: 163, bodyType: 'Average', goal: 'Weight loss', category: 'normal', monthsAgo: 0, attendanceRate: 0.6 },
];

/**
 * Sample personal routines, written exactly the way trainers send them on WhatsApp
 * and imported with the same parser the admin "Import from WhatsApp" button uses.
 */
const PLAN_TEMPLATES: Record<'muscle' | 'fatloss' | 'beginner', { title: string; notes: string; text: string }> = {
  muscle: {
    title: 'Muscle Gain Split – 4 Days',
    notes: 'Rest 60–90s between sets. Increase weight when the last set feels easy. Eat 2g protein per kg bodyweight.',
    text: `1 day - Chest & Biceps
Incline flyes 12 10 8
Incline press (m) 12 10 8
Incline (D/b press 10 8 8)
Bench press (m) 12 10 8
Cable flyes 10-3
Decline bench 8 10 12

Biceps:
Z bar curl 10-2 8-2
D/b curl 10 8 6
Cable curl 8-4
Hammer curl 10-2 8-2

2 day - Shoulders & Traps
B/b upright row 12 10 8
D/b shrugs 12-2 10-2
Bent over lateral 12-2 10-2
Face pull 10-3
D/b front raise 12-3
Cable one arm front raise 10-3

Back side lateral 12-3 (D/b side lateral 10-3)

3 day - Back & Triceps
Lat pulldown 12 10 8
Seated cable row 12 10 8
One arm D/b row 10-3
Deadlift 8 6 6 (Keep back neutral)

Triceps:
Triceps pushdown 12-3
Overhead extension 10-3
Dips till failure

4 day - Legs & Core
Squat 12 10 8 6
Leg press 12-3
Leg extension 15-3
Leg curl 12-3
Standing calf raise 20-4

Abs:
Hanging leg raise 15-3
Plank 1 min-3`,
  },
  fatloss: {
    title: 'Weight Loss & Muscle Tone Schedule',
    notes: 'Keep rest short (30–45s). Finish every session with 20 min cardio. Drink 3L water daily.',
    text: `1 day - Upper Body
Bench press (m) 15 12 10
Lat pulldown 15 12 10
D/b shoulder press 12-3
Seated cable row 12-3
Cable curl 15-3
Triceps pushdown 15-3

Cardio:
Treadmill incline walk 20 min

2 day - Lower Body & Core
Goblet squat 15-3
Leg press 15 12 10
Walking lunges 12-3 (each leg)
Leg curl 15-3
Crunches 20-3
Russian twist 20-3

Cycling 20 min

3 day - Full Body Circuit
Kettlebell swing 15-4
Push-ups till failure
D/b row 12-3
Step ups 12-3
Mountain climbers 30 sec-4
Rowing machine 10 min`,
  },
  beginner: {
    title: 'Beginner Full Body – 3 Days',
    notes: 'Focus on form before weight. Ask a trainer to check your squat and deadlift. Warm up 10 min.',
    text: `1 day - Full Body A
Squat (m) 12-3
Bench press (m) 12-3
Lat pulldown 12-3
D/b shoulder press 10-3
Plank 30 sec-3

2 day - Full Body B
Leg press 12-3
Incline D/b press 12-3
Seated cable row 12-3
D/b lateral raise 12-3
Crunches 15-3

3 day - Full Body C
Goblet squat 12-3
Push-ups 10-3
One arm D/b row 10-3
Leg curl 12-3
Treadmill 15 min`,
  },
};

function templateFor(goal: string, monthsAgo: number) {
  if (goal === 'Weight loss' || goal === 'Endurance') return PLAN_TEMPLATES.fatloss;
  if (monthsAgo <= 1 || goal === 'Flexibility & mobility' || goal === 'General fitness') return PLAN_TEMPLATES.beginner;
  return PLAN_TEMPLATES.muscle;
}

async function seedAdmin() {
  const email = 'admin@gym.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`✔ Admin already exists (${email})`);
    return existing;
  }
  const admin = await User.create({
    name: 'Gym Admin',
    email,
    password: await bcrypt.hash('admin123', 12),
    phone: '+94 77 000 0000',
    address: 'Power Zone Gym, Colombo',
    age: 35,
    gender: 'male',
    weight: 80,
    height: 178,
    bodyType: 'Athletic',
    fitnessGoal: 'General fitness',
    membershipCategory: 'normal',
    role: 'admin',
    isActive: true,
  });
  console.log(`✔ Created admin: ${email} / admin123`);
  return admin;
}

async function seedSampleData(adminId: mongoose.Types.ObjectId) {
  const memberCount = await User.countDocuments({ role: 'member' });
  if (memberCount > 0) {
    console.log(`ℹ ${memberCount} members already exist — skipping sample data (use --reset to start fresh).`);
    return;
  }

  await Settings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', pricing: { ...MEMBERSHIP_PRICING } } },
    { upsert: true },
  );
  const pricing = { ...MEMBERSHIP_PRICING };
  const password = await bcrypt.hash('member123', 12);
  const now = new Date();
  const today = startOfDay(now);

  let paymentCount = 0;
  let attendanceCount = 0;

  for (const [i, m] of SAMPLE_MEMBERS.entries()) {
    const first = m.name.split(' ')[0].toLowerCase();
    const registered = subDays(subMonths(now, m.monthsAgo), Math.floor(rand() * 20));
    const startWeight = Math.round((m.weight + (m.goal === 'Weight loss' ? 3 : -1.5)) * 10) / 10;

    const user = await User.create({
      name: m.name,
      email: `${first}@example.com`,
      password,
      phone: `+94 7${Math.floor(rand() * 9)} ${String(Math.floor(rand() * 900) + 100)} ${String(Math.floor(rand() * 9000) + 1000)}`,
      address: `${Math.floor(rand() * 200) + 1} ${pick(['Galle Road', 'Kandy Road', 'Duplication Road', 'Baseline Road', 'High Level Road'])}, ${pick(['Colombo', 'Dehiwala', 'Nugegoda', 'Rajagiriya', 'Kotte'])}`,
      age: m.age,
      gender: m.gender,
      weight: m.weight,
      height: m.height,
      bodyType: m.bodyType,
      fitnessGoal: m.goal,
      healthConditions: m.health ?? '',
      membershipCategory: m.category,
      registeredDate: registered,
      role: 'member',
      isActive: true,
      weightHistory:
        m.monthsAgo > 0
          ? [
              { weight: startWeight, date: registered },
              { weight: Math.round(((startWeight + m.weight) / 2) * 10) / 10, date: addDays(registered, 30) },
              { weight: m.weight, date: subDays(now, 5) },
            ]
          : [{ weight: m.weight, date: registered }],
    });

    // Payments: one record per month since registration
    const payments = [];
    for (let back = m.monthsAgo; back >= 0; back--) {
      const d = subMonths(now, back);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const isCurrent = back === 0;
      const roll = rand();
      let status: 'paid' | 'pending' | 'overdue';
      if (isCurrent) status = roll < 0.55 ? 'paid' : 'pending';
      else status = roll < 0.88 ? 'paid' : 'overdue';

      const method = rand() < 0.5 ? 'cash' : 'online';
      const paidAt = isCurrent ? subDays(now, Math.floor(rand() * Math.max(now.getDate() - 1, 1))) : new Date(year, month - 1, 2 + Math.floor(rand() * 10), 10);
      payments.push({
        member: user._id,
        amount: pricing[m.category],
        month,
        year,
        paymentStatus: status,
        ...(status === 'paid'
          ? {
              paymentMethod: method,
              paidAt,
              ...(method === 'cash'
                ? { markedBy: adminId, markedAt: paidAt }
                : { stripePaymentId: `pi_demo_${user._id.toString().slice(-6)}${month}`, stripeSessionId: `cs_demo_${user._id.toString().slice(-6)}${month}` }),
            }
          : {}),
      });
    }
    await Payment.insertMany(payments);
    paymentCount += payments.length;

    // Attendance for the last ~60 days (since registration)
    const records = [];
    const from = startOfDay(registered > subDays(now, 60) ? registered : subDays(now, 60));
    for (let day = from; day <= today; day = addDays(day, 1)) {
      const isToday = day.getTime() === today.getTime();
      const sunday = day.getDay() === 0;
      if (rand() > m.attendanceRate * (sunday ? 0.4 : 1)) continue;
      const hour = pick([5, 6, 6, 7, 7, 8, 12, 17, 18, 18, 19, 20]);
      const checkIn = new Date(day);
      checkIn.setHours(hour, Math.floor(rand() * 60), 0, 0);
      if (isToday && checkIn > now) continue;
      records.push({ member: user._id, date: day, checkInTime: checkIn });
    }
    if (records.length) await Attendance.insertMany(records);
    attendanceCount += records.length;
  }

  console.log(`✔ Created ${SAMPLE_MEMBERS.length} members (password: member123)`);
  console.log(`✔ Created ${paymentCount} payment records`);
  console.log(`✔ Created ${attendanceCount} attendance records`);
}

/**
 * Give every sample member (…@example.com) without a plan a personal routine.
 * Real members are never touched.
 */
async function seedPlans(adminId: mongoose.Types.ObjectId) {
  const members = await User.find({ role: 'member', email: /@example\.com$/ })
    .select('name fitnessGoal registeredDate')
    .sort({ createdAt: 1 })
    .lean();
  const existing = new Set((await MemberWorkoutPlan.find({ member: { $in: members.map((m) => m._id) } }).distinct('member')).map(String));
  let created = 0;
  for (const [i, m] of members.entries()) {
    if (existing.has(m._id.toString())) continue;
    if (i % 5 === 4) continue; // leave a few without a plan so "Need a plan" has examples
    const monthsAgo = Math.max(0, Math.round((Date.now() - new Date(m.registeredDate).getTime()) / (30 * 86_400_000)));
    const t = templateFor(m.fitnessGoal, monthsAgo);
    await MemberWorkoutPlan.create({
      member: m._id,
      gymName: GYM.name,
      planTitle: t.title,
      startDate: m.registeredDate,
      notes: t.notes,
      days: parseWhatsAppPlan(t.text),
      updatedBy: adminId,
    });
    created++;
  }
  console.log(`✔ Created ${created} personal workout plans`);
}

/** Remove data left over from the old generic chart library. */
async function cleanupLegacyCharts() {
  const db = mongoose.connection.db!;
  const unset = await db.collection('users').updateMany({ assignedChart: { $exists: true } }, { $unset: { assignedChart: '' } });
  const legacy = await db.listCollections({ name: 'workoutcharts' }).toArray();
  if (legacy.length) await db.dropCollection('workoutcharts');
  if (unset.modifiedCount || legacy.length) console.log('✔ Removed legacy workout chart templates');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✖ MONGODB_URI is not set. Add it to .env.local');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✔ Connected to MongoDB');

  // Make sure indexes (incl. unique constraints) exist before inserting.
  await Promise.all([User.syncIndexes(), Payment.syncIndexes(), Attendance.syncIndexes(), MemberWorkoutPlan.syncIndexes(), Settings.syncIndexes()]);

  if (RESET) {
    await Promise.all([User.deleteMany({}), Payment.deleteMany({}), Attendance.deleteMany({}), MemberWorkoutPlan.deleteMany({}), Settings.deleteMany({})]);
    console.log('✔ Cleared all collections');
  }

  const admin = await seedAdmin();
  await cleanupLegacyCharts();
  if (!ADMIN_ONLY) {
    await seedSampleData(admin._id);
    await seedPlans(admin._id);
  }

  await mongoose.disconnect();
  console.log('\n🏋️  Seed complete. Sign in at http://localhost:3000/login');
}

main().catch(async (err) => {
  console.error('✖ Seed failed:', err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
