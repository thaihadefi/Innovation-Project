import { CVEditForm } from "./CVEditForm";

export default async function CVEditPage(props: PageProps<'/candidate-manage/cv/edit/[id]'>) {
  const { id } = await props.params;

  return (
    <div className="py-[30px]">
      <div className="container">
        <CVEditForm cvId={id} />
      </div>
    </div>
  );
}
