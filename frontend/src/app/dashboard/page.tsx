export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 rounded-full">
            <div className="w-6 h-6 text-blue-600 font-bold text-center">3</div>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Milestones</p>
            <p className="text-2xl font-bold text-gray-800">Pending</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-50 rounded-full">
            <div className="w-6 h-6 text-emerald-600 font-bold text-center">%</div>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg Plagiarism Score</p>
            <p className="text-2xl font-bold text-gray-800">12%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-purple-50 rounded-full">
            <div className="w-6 h-6 text-purple-600 font-bold text-center">2</div>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Recent Submissions</p>
            <p className="text-2xl font-bold text-gray-800">Reviewed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
