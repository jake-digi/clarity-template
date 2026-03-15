import { DocIcon } from './icons/PostmanIcons';

const RightSidebar = () => {
  return (
    <div className="w-10 bg-card border-l border-border flex flex-col items-center py-2">
      <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-accent rounded">
        <DocIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default RightSidebar;
