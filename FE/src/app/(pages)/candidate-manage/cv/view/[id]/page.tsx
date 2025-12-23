import { CVViewer } from "./CVViewer";

export default async function CVViewPage(props: PageProps<'/candidate-manage/cv/view/[id]'>) {
  const { id } = await props.params;

  return (
    <div className="py-[30px]">
      <div className="container">
        <CVViewer cvId={id} />
      </div>
    </div>
  );
}
