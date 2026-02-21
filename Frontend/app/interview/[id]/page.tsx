import InterviewDashboard from '@/components/InterviewDashboard';
import { getInterviewContext } from '@/app/actions/get-interview-context';

interface InterviewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InterviewPage({ params, searchParams }: InterviewPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const forensicContext = await getInterviewContext();

  const nameParam = query.name;
  const roleParam = query.role;
  const candidateName = typeof nameParam === 'string' && nameParam.trim() ? nameParam : 'Candidate';
  const role = typeof roleParam === 'string' && roleParam.trim() ? roleParam : 'Software Engineer';

  return (
    <InterviewDashboard
      candidateName={candidateName}
      role={role}
      roomId={id}
      forensicContext={forensicContext}
    />
  );
}
