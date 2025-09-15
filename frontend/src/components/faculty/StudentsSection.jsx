import React, { useState, useEffect } from "react";
import { Search, Users, Mail, User, BookOpen, Filter, ChevronDown, ChevronUp } from "lucide-react";

const StudentsSection = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [expandedStudent, setExpandedStudent] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://82.112.238.4:9000/api/faculty/students-data', {
                    headers: { 
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                setStudents(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Failed to load students. Please try again.");
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.erpid?.includes(searchTerm) || // Use optional chaining
        student.roll_no?.includes(searchTerm) || // Use optional chaining
        student.division?.toLowerCase().includes(searchTerm.toLowerCase()) // Use optional chaining
    );

    const handleStudentClick = (studentId) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
    };

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        switch (sortBy) {
            case 'roll_no':
                return (a.roll_no || '').localeCompare(b.roll_no || '');
            case 'name':
                return a.name.localeCompare(b.name);
            case 'email':
                return a.email.localeCompare(b.email);
            case 'erpid':
                return (a.erpid || '').localeCompare(b.erpid || '');
            case 'year':
                return a.year - b.year;
            case 'division':
                return (a.division || '').localeCompare(b.division || '');
            default:
                return (a.roll_no || '').localeCompare(b.roll_no || ''); // Make roll_no the default sort
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                            <Users className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800">Students Dashboard </h1>
                            <p className="text-gray-600 mt-1">Manage and view all student information</p>
                        </div>
                    </div>
                    
                    {/* Stats Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-green-100 rounded-xl">
                                    <BookOpen className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Students</p>
                                    <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Active Enrollments</p>
                                <p className="text-lg font-semibold text-indigo-600">{filteredStudents.length} showing</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search by name, email, ERP ID, roll number, or division..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent transition-all duration-200 bg-white"
                            >
                                <option value="roll_no">Sort by Roll No</option>
                                <option value="name">Sort by Name</option>
                                <option value="erpid">Sort by ERP ID</option>
                                <option value="email">Sort by Email</option>
                                <option value="year">Sort by Year</option>
                                <option value="division">Sort by Division</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Users className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-800">Error Loading Students</h3>
                                <p className="text-red-600">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Updated Students List */}
                {sortedStudents.length > 0 ? (
                    <div className="space-y-4">
                        {sortedStudents.map(student => (
                            <div 
                                key={student.id} 
                                className="bg-white rounded-2xl shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
                            >
                                {/* Clickable Header */}
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleStudentClick(student.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-[#b22b2f] rounded-xl shadow-lg">
                                            <User className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">
                                                {student.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>Roll No: {student.roll_no}</span>
                                                <span>•</span>
                                                <span>Year {student.year}</span>
                                                <span>•</span>
                                                <span>Div {student.division}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {expandedStudent === student.id ? 
                                        <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    }
                                </div>

                                {/* Expandable Details */}
                                {expandedStudent === student.id && (
                                    <div className="p-4 border-t border-gray-100">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 bg-[#b22b2f] bg-opacity-10 rounded">
                                                        <span className="text-xs font-semibold text-[#b22b2f]">#</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-500">ERP ID</span>
                                                        <p className="text-sm font-medium">{student.erpid}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-4 w-4 text-[#b22b2f]" />
                                                    <div>
                                                        <span className="text-xs text-gray-500">Email</span>
                                                        <p className="text-sm">{student.email}</p>
                                                    </div>
                                                </div>

                                                {student.contact_no && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 bg-[#b22b2f] bg-opacity-10 rounded">
                                                            <span className="text-xs font-semibold text-[#b22b2f]">📱</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-500">Contact</span>
                                                            <p className="text-sm">{student.contact_no}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {student.dob && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 bg-[#b22b2f] bg-opacity-10 rounded">
                                                            <span className="text-xs font-semibold text-[#b22b2f]">🎂</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-500">Date of Birth</span>
                                                            <p className="text-sm">{new Date(student.dob).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button className="mt-4 w-full py-2 px-4 bg-[#b22b2f] text-white rounded-lg hover:bg-[#a02529] transition-all duration-200 font-medium text-sm">
                                                View Full Profile
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <p className="text-gray-600">No students found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsSection;
