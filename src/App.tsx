import { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  Users,
  Award,
  Search
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCard } from './components/MetricCard';
import { CourseCard } from './components/CourseCard';
import { CreateCourseModal } from './components/CreateCourseModal';
import { CourseDetailsModal } from './components/CourseDetailsModal';
import { initialCourses } from './data/courses';
import type { Course } from './types';

export function App() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [activeTab, setActiveTab] = useState('courses');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'UPCOMING_ONGOING' | 'COMPLETED'>('UPCOMING_ONGOING');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);

  // Counters
  const totalCourses = courses.length;
  const upcomingCount = courses.filter((c) => c.status === 'UPCOMING').length;
  const ongoingCount = courses.filter((c) => c.status === 'ONGOING').length;
  const completedCount = courses.filter((c) => c.status === 'COMPLETED').length;

  // Filtered courses based on status tabs & search inputs
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Status filter
      if (statusTab === 'UPCOMING_ONGOING') {
        if (course.status !== 'UPCOMING' && course.status !== 'ONGOING') {
          return false;
        }
      } else if (statusTab === 'COMPLETED') {
        if (course.status !== 'COMPLETED') {
          return false;
        }
      }

      // Course-specific search filter
      const query = (courseSearch || globalSearch).toLowerCase().trim();
      if (query) {
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesInstructor = course.instructor.toLowerCase().includes(query);
        const matchesDescription = course.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesInstructor && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [courses, statusTab, courseSearch, globalSearch]);

  const handleCreateCourse = (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev]);
  };

  const handleAddParticipant = (courseId: string, participant: any) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const updated = {
            ...c,
            participants: [participant, ...c.participants],
          };
          if (selectedCourseForDetails?.id === courseId) {
            setSelectedCourseForDetails(updated);
          }
          return updated;
        }
        return c;
      })
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Title & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mt-1 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
                  Course Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Manage spiritual education, track enrollments and payments
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0062FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-full shadow-md shadow-blue-500/25 transition-all duration-150 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          </div>

          {/* KPI Metrics Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={BookOpen}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
              value={totalCourses}
              label="TOTAL COURSES"
              onClick={() => {
                setStatusTab('UPCOMING_ONGOING');
                setCourseSearch('');
              }}
            />
            <MetricCard
              icon={Calendar}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-500"
              value={upcomingCount}
              label="UPCOMING"
              onClick={() => {
                setStatusTab('UPCOMING_ONGOING');
                setCourseSearch('');
              }}
            />
            <MetricCard
              icon={Users}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-500"
              value={ongoingCount}
              label="ONGOING"
              onClick={() => {
                setStatusTab('UPCOMING_ONGOING');
                setCourseSearch('');
              }}
            />
            <MetricCard
              icon={Award}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-500"
              value={completedCount}
              label="COMPLETED"
              onClick={() => {
                setStatusTab('COMPLETED');
                setCourseSearch('');
              }}
            />
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Segmented Status Toggle Pill */}
            <div className="inline-flex bg-slate-100/90 p-1 rounded-xl self-start">
              <button
                onClick={() => setStatusTab('UPCOMING_ONGOING')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusTab === 'UPCOMING_ONGOING'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upcoming & Ongoing
              </button>
              <button
                onClick={() => setStatusTab('COMPLETED')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusTab === 'COMPLETED'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Courses Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses or instructors..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-full focus:border-blue-500 focus:outline-hidden transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Courses Cards Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onViewDetails={(c) => setSelectedCourseForDetails(c)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No courses found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {courseSearch || globalSearch
                  ? 'No course matches your search keyword. Try clearing the search term.'
                  : 'There are currently no courses in this section.'}
              </p>
              {courseSearch && (
                <button
                  onClick={() => setCourseSearch('')}
                  className="mt-4 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCourse={handleCreateCourse}
      />

      <CourseDetailsModal
        course={selectedCourseForDetails}
        onClose={() => setSelectedCourseForDetails(null)}
        onAddParticipant={handleAddParticipant}
      />
    </div>
  );
}

export default App;

