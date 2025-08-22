import { ProjectLayout } from '@/components/project/project-layout';

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectLayout>
      {children}
    </ProjectLayout>
  );
}