function ShellUI() {
    console.log("in shell");
	var self = this;

	self.shellUserDropdown = null;
	self.shellNavDropdown = null;
	self.shellNavTab = null;
	self.shellToggle = null;

	// Breakpoint between small and large devices
	self.breakpoint = 899;

	// Throttle resize events to avoid firing a lot of resize handlers
	self.resizeTimeout = null;

	self.resizeThrottler = function() {
		// Ignore resize events as long as a resizeHandler execution is in the queue
		if (!self.resizeTimeout) {
			self.resizeTimeout = setTimeout(function() {
				self.resizeTimeout = null;
				self.resizeHandler();

				// Wait 250ms before firing the resize handler
			}, 250);
		}
	};

	self.resizeHandler = function() {
		self.shellNavDropdown.adjustOffset();
	};

	// Are we on a small viewport?
	self.matchesSmall = function() {
		if (window.matchMedia) {
			// The browser supports JS media queries
			return window.matchMedia('(max-width: ' + self.breakpoint + 'px)').matches;
		} else {
			// Fallback solution
			return ($(window).width() < self.breakpoint);
		}
	};

	// Are we on a large viewport?
	self.matchesLarge = function() {
		if (window.matchMedia) {
			// The browser supports JS media queries
			return window.matchMedia('(min-width: ' + self.breakpoint + 'px)').matches;
		} else {
			// Fallback solution
			return ($(window).width() >= self.breakpoint);
		}
	};

	self.init = function() {
		self.shellUserDropdown = new ShellUserDropdown(self);
		self.shellNavDropdown = new ShellNavDropdown(self);
		self.shellNavTab = new ShellNavTab(self);
		self.shellToggle = new ShellToggle(self);

		$(window).resize(self.resizeThrottler);
	};

	self.init();
}

// User menu
function ShellUserDropdown(shellUI) {
	var self = this;

	// Reference of the parent ShellUI instance
	self.shellUI = shellUI;

	self.open = function() {
		$('.shell-header-user').addClass('active');
	};

	self.close = function() {
		$('.shell-header-user').removeClass('active');
	};

	self.toggle = function(label) {
		$(label).closest('.shell-header-user').toggleClass('active');
	};

	self.init = function() {
		$('.shell-header-user-label a').on('click.shellUserDropdown', function() {
			self.toggle(this);
			return false;
		});

		// Close the user menu when clicking outside
		$(document).on('click.shellUserDropdownOutside', function(event) {
			if (! $(event.target).closest('.shell-header-user').length) {
				self.close();
			}
		});

		// Close the user menu when pressing Esc key
		$(document).on('keyup.shellUserDropdownOutside', function(event) {
			if (event.keyCode == 27) {
				self.close();
			}
		});
	};

	self.init();
}

// Nav menus (L1)
function ShellNavDropdown(shellUI) {
    console.log("in nav");
	var self = this;

	// Reference of the parent ShellUI instance
	self.shellUI = shellUI;

	self.open = function(dropdown) {
		dropdown.addClass('active');

		if (self.shellUI.matchesLarge()) {
			// Set the first tab as active on desktop
			self.shellUI.shellNavTab.displayFirst(dropdown);

			// Adjust horizontal offset
			self.offset(dropdown);
		}
	};

	// Calculate dropdown horizontal offset on desktop to avoid overflow
	self.offset = function(dropdown) {
		var shellHeaderWrapper = dropdown.closest('.shell-header-wrapper'),
			dropdownContent = dropdown.find('.shell-header-dropdown-content'),
			offset = shellHeaderWrapper.offset().left + shellHeaderWrapper.outerWidth() -
					 (dropdown.offset().left + dropdownContent.outerWidth());

		// Set left position if needed
		dropdownContent.css('left', (offset < 0) ? offset : '');
	};

	self.adjustOffset = function() {
		var dropdown = $('.shell-header-dropdown.active');
		if (dropdown.length) {
			self.offset(dropdown);
		}
	};

	self.close = function(dropdown) {
		dropdown.removeClass('active');
	};

	self.closeAll = function() {
		$('.shell-header-dropdown').removeClass('active');
	};

	self.toggle = function(label) {
		var dropdown = $(label).closest('.shell-header-dropdown'),
			otherDropdowns = dropdown.siblings('.shell-header-dropdown');

		if (dropdown.hasClass('active')) {
			// Close the active dropdown if its label is clicked
			self.close(dropdown);
		} else {
			// Close all the dropdowns minus the chosen dropdown
			otherDropdowns.removeClass('active');
			self.open(dropdown);
		}
	};

	self.init = function() {
		// Direct link without dropdown
		$('.shell-header-dropdown-label a:not(.shell-header-direct-link)').click(function() {
			self.toggle(this);
			return false;
		});

		// Close dropdowns when clicking outside
		$(document).on('click.shellNavDropdownOutside', function(event) {
			if (! $(event.target).closest('.shell-header-nav').length) {
				self.closeAll();
			}
		});

		// Close dropdowns when pressing Esc key
		$(document).on('keyup.shellNavDropdownOutside', function(event) {
			if (event.keyCode == 27) {
				self.closeAll();
			}
		});
	};

	self.init();
}

// Nav submenus (L2)
function ShellNavTab(shellUI) {
	var self = this;

	// Reference of the parent ShellUI instance
	self.shellUI = shellUI;

	self.display = function(label) {
		var tab = $(label).closest('.shell-header-dropdown-tab'),
			tabs = tab.siblings('.shell-header-dropdown-tab');

		if (! tab.hasClass('active')) {
			tabs.removeClass('active');
			tab.addClass('active');
			self.displayImg(tab);
		}
	};

	// Lazy loading of images in a tab container
	self.displayImg = function(tab) {
		// Changing data-src attribute to src
		tab.find('img[data-src]').attr('src', function() {
			return $(this).attr('data-src');
		}).removeAttr('data-src');
	};

	self.toggle = function(label) {
		var tab = $(label).closest('.shell-header-dropdown-tab'),
			tabs = tab.siblings('.shell-header-dropdown-tab');

		if (tab.hasClass('active')) {
			tab.removeClass('active');
		} else {
			tabs.removeClass('active');
			tab.addClass('active');
		}
	};

	// Display the first tab
	self.displayFirst = function(dropdown) {
		self.display(dropdown.find('.shell-header-dropdown-tab:first-child .shell-header-dropdown-tab-label a'));
	};

	self.init = function() {
		$('.shell-header-dropdown-tab-label a').on('mouseenter.shellNavTab focus.shellNavTab', function() {
			// On desktop tabs are activated when hovering
			if (self.shellUI.matchesLarge()) {
				self.display(this);
			}
		}).on('click.shellNavTab', function() {
			// On mobile tabs are toggled when clicking
			if (self.shellUI.matchesSmall()) {
				self.toggle(this);
			}

			return false;
		});
	};

	self.init();
}

// Toggle search, user menu, nav on mobile
function ShellToggle(shellUI) {
	var self = this;

	// Reference of the parent ShellUI instance
	self.shellUI = shellUI;

	self.init = function() {
		$('.shell-header-toggle-search').on('click.shellToggle', function() {
			var shellHeaderSearch = $('.shell-header-search');
			shellHeaderSearch.toggleClass('expanded');

			// Focus the search input field when expanded
			if (shellHeaderSearch.hasClass('expanded')) {
				shellHeaderSearch.find('input[type="search"]').focus();
			}
		});

		$('.shell-header-toggle-menu').on('click.shellToggle', function() {
			$('.shell-header-user, .shell-header-nav').toggleClass('expanded');
		});
	};

	self.init();
}

// Initialize the shell on DOM loaded
$(function() {
	window.shellUI = new ShellUI();
});
