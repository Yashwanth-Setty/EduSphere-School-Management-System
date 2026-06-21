"use client";

import { useState } from "react";

const STAFF = [
  { id: "1",  name: "Dr. Suresh Babu",      role: "Principal",         dept: "Administration", phone: "9876540001", email: "principal@spira.edu", joinDate: "2015-06-01", status: "active",   salary: "₹1,20,000" },
  { id: "2",  name: "Mrs. Anitha Rao",       role: "Vice Principal",    dept: "Administration", phone: "9876540002", email: "vp@spira.edu",        joinDate: "2017-07-15", status: "active",   salary: "₹95,000"  },
  { id: "3",  name: "Mr. Arjun Sharma",      role: "Teacher",           dept: "Mathematics",    phone: "9876540003", email: "arjun@spira.edu",     joinDate: "2022-07-01", status: "active",   salary: "₹55,000"  },
  { id: "4",  name: "Ms. Priya Nair",        role: "Teacher",           dept: "Science",        phone: "9876540004", email: "priya@spira.edu",     joinDate: "2021-06-15", status: "active",   salary: "₹52,000"  },
  { id: "5",  name: "Ms. Rachel Thomas",     role: "Teacher",           dept: "English",        phone: "9876540005", email: "rachel@spira.edu",    joinDate: "2023-08-01", status: "active",   salary: "₹48,000"  },
  { id: "6",  name: "Mr. Deepak Verma",      role: "Teacher",           dept: "Social Studies", phone: "9876540006", email: "deepak@spira.edu",    joinDate: "2020-07-10", status: "active",   salary: "₹50,000"  },
  { id: "7",  name: "Ms. Kavitha Reddy",     role: "Teacher",           dept: "Hindi",          phone: "9876540007", email: "kavitha@spira.edu",   joinDate: "2019-08-05", status: "active",   salary: "₹47,000"  },
  { id: "8",  name: "Mr. Samuel George",     role: "Teacher",           dept: "Physics",        phone: "9876540008", email: "samuel@spira.edu",    joinDate: "2022-07-20", status: "active",   salary: "₹54,000"  },
  { id: "9",  name: "Dr. Meera Krishnan",    role: "Counselor",         dept: "Student Welfare",phone: "9876540009", email: "meera@spira.edu",     joinDate: "2020-03-10", status: "on_leave", salary: "₹60,000"  },
  { id: "10", name: "Mr. Rajesh Pillai",     role: "Accountant",        dept: "Finance",        phone: "9876540010", email: "rajesh@spira.edu",    joinDate: "2018-04-01", status: "active",   salary: "₹58,000"  },
  { id: "11", name: "Ms. Sunita Mehta",      role: "Librarian",         dept: "Library",        phone: "9876540011", email: "sunita@spira.edu",    joinDate: "2019-06-15", status: "active",   salary: "₹42,000"  },
  { id: "12", name: "Mr. Ganesh Kumar",      role: "Receptionist",      dept: "Front Office",   phone: "9876540012", email: "ganesh@spira.edu",    joinDate: "2021-09-01", status: "active",   salary: "₹32,000"  },
  { id: "13", name: "Mr. Raju Verma",        role: "Driver",            dept: "Transport",      phone: "9876540013", email: "raju@spira.edu",      joinDate: "2020-01-10", status: "active",   salary: "₹28,000"  },
  { id: "14", name: "Mr. Vijay Kumar",       role: "Driver",            dept: "Transport",      phone: "9876540014", email: "vijay@spira.edu",     joinDate: "2021-03-15", status: "active",   salary: "₹28,000"  },
  { id: "15", name: "Mr. Ramesh Singh",      role: "Driver",            dept: "Transport",      phone: "9876540015", email: "ramesh@spira.edu",    joinDate: "2022-05-20", status: "active",   salary: "₹28,000"  },
  { id: "16", name: "Mr. Anthony Joseph",    role: "Driver",            dept: "Transport",      phone: "9876540016", email: "anthony@spira.edu",   joinDate: "2023-01-05", status: "active",   salary: "₹28,000"  },
  { id: "17", name: "Mrs. Lakshmi Devi",     role: "Hostel Warden",     dept: "Hostel (Girls)", phone: "9876540017", email: "lakshmi@spira.edu",   joinDate: "2019-07-01", status: "active",   salary: "₹40,000"  },
  { id: "18", name: "Mr. Sunil Patel",       role: "Hostel Warden",     dept: "Hostel (Boys)",  phone: "9876540018", email: "sunil@spira.edu",     joinDate: "2020-08-15", status: "active",   salary: "₹40,000"  },
  { id: "19", name: "Ms. Nandini Singh",     role: "Teacher",           dept: "Chemistry",      phone: "9876540019", email: "nandini@spira.edu",   joinDate: "2021-07-01", status: "active",   salary: "₹52,000"  },
  { id: "20", name: "Mr. Praveen Kumar",     role: "Teacher",           dept: "Biology",        phone: "9876540020", email: "praveen@spira.edu",   joinDate: "2022-06-01", status: "active",   salary: "₹50,000"  },
  { id: "21", name: "Ms. Divya Menon",       role: "Teacher",           dept: "Computer Science",phone:"9876540021", email: "divya@spira.edu",     joinDate: "2023-07-15", status: "active",   salary: "₹53,000"  },
  { id: "22", name: "Mr. Ashok Tiwari",      role: "Teacher",           dept: "Physical Ed",    phone: "9876540022", email: "ashok@spira.edu",     joinDate: "2018-07-01", status: "inactive", salary: "₹45,000"  },
];

const ROLE_COLORS: Record<string, string> = {
  "Principal":       "bg-purple-100 text-purple-700",
  "Vice Principal":  "bg-indigo-100 text-indigo-700",
  "Teacher":         "bg-blue-100 text-blue-700",
  "Counselor":       "bg-teal-100 text-teal-700",
  "Accountant":      "bg-green-100 text-green-700",
  "Librarian":       "bg-yellow-100 text-yellow-700",
  "Receptionist":    "bg-orange-100 text-orange-700",
  "Driver":          "bg-cyan-100 text-cyan-700",
  "Hostel Warden":   "bg-rose-100 text-rose-700",
};

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  on_leave: "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-500",
};

const ROLE_TYPES = ["All", "Teacher", "Principal", "Vice Principal", "Accountant", "Librarian", "Receptionist", "Driver", "Hostel Warden", "Counselor"];

const KPI = [
  { label: "Total Staff",    value: 22,  sub: "all departments",   color: "from-purple-500 to-purple-700" },
  { label: "Teaching Staff", value: 10,  sub: "across all grades",  color: "from-blue-500 to-blue-700"   },
  { label: "Non-Teaching",   value: 10,  sub: "admin & support",    color: "from-teal-500 to-teal-700"   },
  { label: "On Leave",       value: 1,   sub: "as of today",        color: "from-amber-500 to-orange-600" },
];

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [modal, setModal] = useState<typeof STAFF[0] | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const filtered = STAFF.filter((s) => {
    const matchSearch = `${s.name} ${s.dept} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-text-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text-900">Staff Management</h1>
          <p className="text-text-500 text-sm mt-0.5">{STAFF.length} staff members across all departments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => showToast("Export feature coming soon")} className="px-3 py-2 text-sm border border-border rounded-lg bg-white hover:bg-surface-50">
            ↓ Export
          </button>
          <button onClick={() => showToast("Add Staff form coming soon")} className="px-4 py-2 bg-spira-700 text-white text-sm font-medium rounded-lg hover:bg-spira-800">
            + Add Staff
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI.map((k) => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} rounded-xl p-4 text-white`}>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">{k.label}</p>
            <p className="text-3xl font-bold mt-1">{k.value}</p>
            <p className="text-white/60 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search staff…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-spira-500 bg-white"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-white"
        >
          {ROLE_TYPES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <span className="self-center text-xs text-text-400">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 border-b border-surface-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Name</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Role</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Department</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden lg:table-cell">Phone</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase hidden md:table-cell">Joined</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-500 uppercase">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-text-400 text-sm">No staff found</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-t border-surface-100 hover:bg-surface-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-text-900">{s.name}</p>
                        <p className="text-[11px] text-text-400 hidden sm:block">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[s.role] ?? "bg-gray-100 text-gray-600"}`}>{s.role}</span>
                  </td>
                  <td className="px-5 py-3 text-text-500 hidden md:table-cell">{s.dept}</td>
                  <td className="px-5 py-3 font-mono text-xs text-text-400 hidden lg:table-cell">{s.phone}</td>
                  <td className="px-5 py-3 text-text-400 text-xs hidden md:table-cell">{s.joinDate}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[s.status] ?? ""}`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(s)} className="text-xs text-spira-700 hover:underline">View</button>
                      <button onClick={() => showToast(`Editing ${s.name}…`)} className="text-xs text-text-400 hover:underline">Edit</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Staff detail modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-spira-100 text-spira-700 flex items-center justify-center text-lg font-bold">
                {modal.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-text-900 text-lg">{modal.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[modal.role] ?? "bg-gray-100 text-gray-600"}`}>{modal.role}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Department", modal.dept],
                ["Email", modal.email],
                ["Phone", modal.phone],
                ["Joined", modal.joinDate],
                ["Salary", modal.salary],
                ["Status", modal.status.replace("_", " ")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between p-2 rounded-lg bg-surface-50">
                  <span className="text-text-500">{k}</span>
                  <span className="font-medium text-text-900 capitalize">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setModal(null); showToast(`Message sent to ${modal.name}`); }} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-surface-50">Message</button>
              <button onClick={() => { setModal(null); showToast("Opening full profile…"); }} className="flex-1 py-2 text-sm bg-spira-700 text-white rounded-lg hover:bg-spira-800">Full Profile</button>
            </div>
            <button onClick={() => setModal(null)} className="mt-3 w-full text-xs text-text-400 hover:text-text-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
