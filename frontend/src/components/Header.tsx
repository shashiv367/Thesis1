export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="font-semibold text-gray-800">
        Welcome back
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-full bg-green-900 text-white flex items-center justify-center font-bold">
          U
        </div>
      </div>
    </header>
  );
}
