import { Link, NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faBookOpen, faQuestionCircle, faBook, } from '@fortawesome/free-solid-svg-icons'
import { type FormEvent, useState } from "react";

const Nav = () => {
  const [sb, setSB] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?search=${encodeURIComponent(searchQuery.trim())}`);
      setSB(false);
      setSearchQuery("");
    }
  }

  return (
    <>
    <nav className="sticky top-0 left-0 z-50 border-b border-gray-300 bg-white backdrop-blur-xl">
      <div className="px-3 sm:px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-3xl font-bold tracking-widest text-black">
            漢
          </Link>


          <ul className="hidden md:flex items-center gap-10">
            {[
              { to: "/", label: "Home", icon: faHouse },
              { to: "/studyPlans", label: "Study Plans", icon: faBookOpen },
              { to: "/quizSets", label: "Quiz Sets", icon: faQuestionCircle },
              { to: "/vocabulary", label: "Vocabulary", icon: faBook },
            ].map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-lg transition-all duration-200 ${isActive ? "bg-[#464c91] border border-green-300/40" : "text-black hover:bg-gray-200 border border-transparent"}`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-2" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          
        </div>

        {sb && (
          <form onSubmit={handleSearch} className="mt-3">
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-2xl w-full h-11 py-2 px-4 border border-green-300/50 bg-black/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-green-400/70"
            />
          </form>
        )}
      </div>
    </nav>

    <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[min(96%,420px)] rounded-2xl border border-gray-300 bg-white backdrop-blur-xl px-2 py-2 shadow-2xl">
      <ul className="grid grid-cols-4 gap-1">
        {[
          { to: "/", label: "Home", icon: faHouse },
          { to: "/studyPlans", label: "Study Plans", icon: faBookOpen },
          { to: "/quizSets", label: "Quiz Sets", icon: faQuestionCircle },
          { to: "/vocabulary", label: "Vocabulary", icon: faBook },
        ].map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-xl py-2 text-[11px] transition-all ${isActive ? "bg-[#464c91] text-white" : "text-black hover:bg-gray-200"}`
              }
            >
              <FontAwesomeIcon icon={item.icon} className="text-sm mb-1" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
    </>
  );
};

export default Nav;
