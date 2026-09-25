import ColorPalette from './sidebar_components/ColorPalette';

function SideBar() {
  return (
    <aside className="fixed left-2 top-1/2 z-20 w-[60px] -translate-y-1/2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg shadow-slate-300/50 backdrop-blur-sm">
      <ColorPalette />
    </aside>
  );
}

export default SideBar