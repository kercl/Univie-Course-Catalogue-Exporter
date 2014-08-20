!["Logo"](https://raw.githubusercontent.com/koe-/Univie-Course-Catalogue-Exporter/master/chrome/img/logo64.png) Univie Course Catalogue Exporter
================================================================================================================================================

Browser extension for exporting Univie Courses to Google Calendar or iCal, supporting Mozilla Firefox and Google Chrome.
For Mozilla Firefox, the extension can be obtained at [AMO](https://addons.mozilla.org/en-US/firefox/addon/univie-course-catalogue-export/).
It will soon be available at the Chrome Web Store.

Loading the extension in Chrome manually
----------------------------------------

First download all the files from the chrome folder to some local empty directory (it's best, if you just download the whole project by clicking the [Download ZIP] button on the right-hand-side of the github page and just forget about the firefox folder) and navigate to chrome://extensions in Chrome (alternatively use [Preferences]->[Tools]->[Extensions]). Next you have to enable the 'Developer mode' checkbox in the top-right corner of the extensions page. Then click on the -- now visible -- button [Load unpacked extension...] and go to the directory you downloaded the extension files to. Open it!
That's it.

Usage
-----

If you navigate to a course catalogue page, you should see a small calendar symbol appearing in chrome's navigation bar. Furthermore you should notice a checkbox besides each course title in the catalogue. Checking these boxes enables the course for extraction. If you click the calendar symbol you see all your selected courses and you can exclude specific problem sessions and export your selection.
Your selected courses are not lost, if you go to some other website. This is useful, if you want to swap between different institutes or programs for instance.

Further notes
-------------

Since the Firefox addon has not been reviewed by Mozilla you will see a warning, if you want to add it to Firefox.

Even though the code for Google Calendar API calls is implemented in both, the chrome and the firefox extension, it can currently only be used in the Firefox extension. This has the simple reason, that in Chrome the app uses something called an application ID, which is generated randomly by the browser if you load the unpacked extension. As long as it's not uploaded to the Web Store this ID is not unique and the comparison with the key, assigned to the API key fails. Please be patient a little longer, until I can upload it to the Web Store.

Adaptions to other browsers are left as an exercise for the reader.

TODO
====
* More aesthetically pleasing interface.
* Make dates, times and other information editable before exporting.
* Still quite a few unparsable courses, especially from the physics department (check out the wiki for further information: https://github.com/koe-/Univie-Course-Catalogue-Exporter/wiki)
* Optimization
* ~~Set up oauth2.0 and google calendar export.~~
* ~~Export to iCal~~
