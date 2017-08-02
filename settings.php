<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package   theme_htwboost
 * @copyright 2017 Hanna Kummel
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// This line protects the file from being accessed by a URL directly.
defined('MOODLE_INTERNAL') || die();

// This is used for performance, we don't need to know about these settings on every page in Moodle, only when
// we are looking at the admin settings pages.
if ($ADMIN->fulltree) {

    // Boost provides a nice setting page which splits settings onto separate tabs. We want to use it here.
    $settings = new theme_boost_admin_settingspage_tabs('themesettinghtwboost', get_string('configtitle', 'theme_htwboost'));

    // Each page is a tab - the first is the "General" tab.
    $page = new admin_settingpage('theme_htwboost_general', get_string('generalsettings', 'theme_htwboost'));

    // Replicate the preset setting from boost.
    $name = 'theme_htwboost/preset';
    $title = get_string('preset', 'theme_htwboost');
    $description = get_string('preset_desc', 'theme_htwboost');
    $default = 'default.scss';

    // We list files in our own file area to add to the drop down. We will provide our own function to
    // load all the presets from the correct paths.
    $context = context_system::instance();
    $fs = get_file_storage();
    $files = $fs->get_area_files($context->id, 'theme_htwboost', 'preset', 0, 'itemid, filepath, filename', false);

    $choices = [];
    foreach ($files as $file) {
        $choices[$file->get_filename()] = $file->get_filename();
    }
    // These are the built in presets from Boost.
    $choices['default.scss'] = 'default.scss';
    $choices['plain.scss'] = 'plain.scss';

    $setting = new admin_setting_configselect($name, $title, $description, $default, $choices);
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    // Preset files setting.
    $name = 'theme_htwboost/presetfiles';
    $title = get_string('presetfiles','theme_htwboost');
    $description = get_string('presetfiles_desc', 'theme_htwboost');

    $setting = new admin_setting_configstoredfile($name, $title, $description, 'preset', 0,
        array('maxfiles' => 20, 'accepted_types' => array('.scss')));
    $page->add($setting);

    // Variable $brand-color.
    // We use an empty default value because the default colour should come from the preset.
    $name = 'theme_htwboost/brandcolor';
    $title = get_string('brandcolor', 'theme_htwboost');
    $description = get_string('brandcolor_desc', 'theme_htwboost');
    $setting = new admin_setting_configcolourpicker($name, $title, $description, '');
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    // Must add the page after defining all the settings!
    $settings->add($page);

    // Each page is a tab - the second is the "Backgrounds" tab.
    $page = new admin_settingpage('theme_htwboost_backgrounds', get_string('backgrounds', 'theme_htwboost'));

    // Default background setting.
    // We use variables for readability.
    $name = 'theme_htwboost/defaultbackgroundimage';
    $title = get_string('defaultbackgroundimage', 'theme_htwboost');
    $description = get_string('defaultbackgroundimage_desc', 'theme_htwboost');
    // This creates the new setting.
    $setting = new admin_setting_configstoredfile($name, $title, $description, 'defaultbackgroundimage');
    // This function will copy the image into the data_root location it can be served from.
    $setting->set_updatedcallback('theme_htwboost_update_settings_images');
    // We always have to add the setting to a page for it to have any effect.
    $page->add($setting);

    // Login page background setting.
    // We use variables for readability.
    $name = 'theme_htwboost/loginbackgroundimage';
    $title = get_string('loginbackgroundimage', 'theme_htwboost');
    $description = get_string('loginbackgroundimage_desc', 'theme_htwboost');
    // This creates the new setting.
    $setting = new admin_setting_configstoredfile($name, $title, $description, 'loginbackgroundimage');
    // This function will copy the image into the data_root location it can be served from.
    $setting->set_updatedcallback('theme_htwboost_update_settings_images');
    // We always have to add the setting to a page for it to have any effect.
    $page->add($setting);

    // Frontpage page background setting.
    // We use variables for readability.
    $name = 'theme_htwboost/frontpagebackgroundimage';
    $title = get_string('frontpagebackgroundimage', 'theme_htwboost');
    $description = get_string('frontpagebackgroundimage_desc', 'theme_htwboost');
    // This creates the new setting.
    $setting = new admin_setting_configstoredfile($name, $title, $description, 'frontpagebackgroundimage');
    // This function will copy the image into the data_root location it can be served from.
    $setting->set_updatedcallback('theme_htwboost_update_settings_images');
    // We always have to add the setting to a page for it to have any effect.
    $page->add($setting);

    // Dashboard page background setting.
    // We use variables for readability.
    $name = 'theme_htwboost/dashboardbackgroundimage';
    $title = get_string('dashboardbackgroundimage', 'theme_htwboost');
    $description = get_string('dashboardbackgroundimage_desc', 'theme_htwboost');
    // This creates the new setting.
    $setting = new admin_setting_configstoredfile($name, $title, $description, 'dashboardbackgroundimage');
    // This function will copy the image into the data_root location it can be served from.
    $setting->set_updatedcallback('theme_htwboost_update_settings_images');
    // We always have to add the setting to a page for it to have any effect.
    $page->add($setting);

    // In course page background setting.
    // We use variables for readability.
    $name = 'theme_htwboost/incoursebackgroundimage';
    $title = get_string('incoursebackgroundimage', 'theme_htwboost');
    $description = get_string('incoursebackgroundimage_desc', 'theme_htwboost');
    // This creates the new setting.
    $setting = new admin_setting_configstoredfile($name, $title, $description, 'incoursebackgroundimage');
    // This function will copy the image into the data_root location it can be served from.
    $setting->set_updatedcallback('theme_htwboost_update_settings_images');
    // We always have to add the setting to a page for it to have any effect.
    $page->add($setting);

    // Must add the page after defining all the settings!
    $settings->add($page);

    // Advanced settings.
    $page = new admin_settingpage('theme_htwboost_advanced', get_string('advancedsettings', 'theme_htwboost'));

    // Raw SCSS to include before the content.
    $setting = new admin_setting_configtextarea('theme_htwboost/scsspre',
        get_string('rawscsspre', 'theme_htwboost'), get_string('rawscsspre_desc', 'theme_htwboost'), '', PARAM_RAW);
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    // Raw SCSS to include after the content.
    $setting = new admin_setting_configtextarea('theme_htwboost/scss', get_string('rawscss', 'theme_htwboost'),
        get_string('rawscss_desc', 'theme_htwboost'), '', PARAM_RAW);
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    $settings->add($page);
}
