const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

let currentUser = null;
let enrolledCourses = [];

const getCurrentUser = async () => {
  try {
    const response = await apiCall('/api/auth/me');
    currentUser = response.loggedIn ? response : null;
    return currentUser;
  } catch (error) {
    currentUser = null;
    return null;
  }
};

const isLoggedIn = async () => {
  const user = await getCurrentUser();
  return !!user && user.loggedIn;
};

const getEnrolledCourses = async () => {
  try {
    const response = await apiCall('/api/courses/enrolled');
    enrolledCourses = response.enrolledCourses || [];
    return enrolledCourses;
  } catch (error) {
    enrolledCourses = [];
    return [];
  }
};

const enrollInCourse = async (id) => {
  try {
    if (!(await isLoggedIn())) {
      alert('Please login to enroll in courses');
      window.location.href = 'login.html';
      return;
    }

    await getEnrolledCourses();
    if (enrolledCourses.includes(id)) {
      alert('You are already enrolled in this course!');
      return;
    }

    await apiCall('/api/courses/enroll', {
      method: 'POST',
      body: JSON.stringify({ courseId: id })
    });

    alert('Successfully enrolled in course!');
    await updateBtn(id);
    await getEnrolledCourses();

    if (location.pathname.includes('courses.html') && typeof window.refreshCoursesEnrollmentStatus === 'function') {
      setTimeout(() => {
        window.refreshCoursesEnrollmentStatus();
      }, 500);
    }
  } catch (error) {
    console.error('Enrollment failed:', error);
    alert(error.message || 'Failed to enroll in course');
  }
};

const updateBtn = async (id) => {
  const buttons = document.querySelectorAll(`button[onclick*="${id}"]`);

  if (buttons.length === 0) {
    const altButtons = document.querySelectorAll(`button[onclick*="handleEnrollment('${id}')"]`);
    altButtons.forEach((btn) => {
      updateButtonAppearance(btn, id);
    });
  } else {
    buttons.forEach((btn) => {
      updateButtonAppearance(btn, id);
    });
  }
};

const updateButtonAppearance = (btn, courseId) => {
  if (btn) {
    btn.innerHTML = '✓ Enrolled';
    btn.className = btn.className.includes('w-100') ? 'btn btn-success w-100' : 'btn btn-sm btn-success';
    btn.disabled = true;
    btn.setAttribute('onclick', `alert('Already enrolled in this course!')`);
  }
};

const checkStatus = async () => {
  try {
    if (await isLoggedIn()) {
      const courses = await getEnrolledCourses();
      if (courses && courses.length > 0) {
        courses.forEach(courseId => {
          updateBtn(courseId);
        });
      }
    }
  } catch (error) {
    console.error('Error checking enrollment status:', error);
  }
};

const handleEnrollment = enrollInCourse;
window.handleEnrollment = handleEnrollment;
window.enrollInCourse = enrollInCourse;
window.unenrollFromCourse = unenrollFromCourse;
window.displayDashboardCourses = displayDashboardCourses;
window.checkStatus = checkStatus;
window.updateBtn = updateBtn;

window.refreshEnrollmentStatus = async () => {
  await checkStatus();
};

const COURSES = {
  html: { title: 'HTML Course for Beginners', image: 'img/course-1.jpg' },
  css: { title: 'Front End Development - CSS', image: 'img/course-2.jpg' },
  javascript: { title: 'Introduction to JavaScript', image: 'img/course-3.jpg' },
  python: { title: 'Python Programming', image: 'img/course-4.jpg' },
  sql: { title: 'SQL Database', image: 'img/course-5.jpg' }
};

const displayDashboardCourses = async () => {
  const container = document.getElementById('enrolledCoursesContainer');
  const total = document.getElementById('totalCourses');

  if (!container) return;

  try {
    if (!(await isLoggedIn())) {
      container.innerHTML = '<div class="col-12 text-center alert alert-warning">Please <a href="login.html">login</a> to view your enrolled courses.</div>';
      if (total) total.textContent = '0';
      return;
    }

    const courses = await getEnrolledCourses();

    if (!courses.length) {
      container.innerHTML = '<div class="col-12 text-center alert alert-info">No courses enrolled yet. <a href="courses.html">Browse courses</a></div>';
      if (total) total.textContent = '0';
      return;
    }

    container.innerHTML = courses.map(id => {
      const c = COURSES[id] || { title: id, image: 'img/course-1.jpg' };
      return `
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="card h-100">
            <img src="${c.image}" class="card-img-top" style="height:200px;object-fit:cover" alt="${c.title}">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${c.title}</h5>
              <p class="card-text flex-grow-1">Continue your learning journey</p>
              <div class="d-flex justify-content-between align-items-center mt-auto">
                <a href="learn.html?id=${id}" class="btn btn-primary btn-sm">Continue Learning</a>
                <div>
                  <span class="badge bg-success me-2">✓ Enrolled</span>
                  <button onclick="unenrollFromCourse('${id}')" class="btn btn-outline-danger btn-sm" title="Unenroll">
                    <i class="fa fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (total) total.textContent = courses.length;
  } catch (error) {
    console.error('Error loading enrolled courses:', error);
    container.innerHTML = '<div class="col-12 text-center alert alert-danger">Error loading enrolled courses. Please try again.</div>';
    if (total) total.textContent = '0';
  }
};

const unenrollFromCourse = async (id) => {
  try {
    if (!(await isLoggedIn())) {
      alert('Please login to manage your enrollments');
      window.location.href = 'login.html';
      return;
    }

    if (confirm('Are you sure you want to unenroll from this course?')) {
      await apiCall('/api/courses/unenroll', {
        method: 'POST',
        body: JSON.stringify({ courseId: id })
      });

      alert('Successfully unenrolled from course!');
      await displayDashboardCourses();
    }
  } catch (error) {
    console.error('Unenroll error:', error);
    alert(error.message || 'Failed to unenroll from course');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname;

  setTimeout(() => {
    if (path.includes('courses.html')) {
      checkStatus();
    }
    if (path.includes('dashboard.html')) {
      displayDashboardCourses();
    }
  }, 1000);
});

window.addEventListener('load', () => {
  const path = location.pathname;

  if (path.includes('courses.html')) {
    setTimeout(() => {
      checkStatus();
    }, 500);
  }
});
