# NeighborLink

## [Installation Guide](https://github.com/nasnet-community/solutions/tree/main/neighbor-link)

نیبرلینک سیستمی است که به افرادی که در شعاع پوشش یک دستگاه استارلینک و اکستندرهای آن قرار دارند، اجازه می‌دهد حتی در شرایطی که اینترنت داخلی و بین‌المللی یک کشور به‌طور کامل قطع شده است، به اینترنت امن و پرسرعت دسترسی پیدا کنند.

نیبرلینک یک سیستم‌عامل OpenWRT شخصی‌سازی‌شده است که به مدیر سیستم امکان می‌دهد اینترنت استارلینک را با کاربران دیگر، مثلاً همسایه‌ها، به اشتراک بگذارد. این سیستم در حال حاضر امکاناتی مانند مدیریت کاربران، تفکیک مسیر (Split Tunneling) و مخفی‌سازی آی‌پی با استفاده از وی‌پی‌ان را فراهم می‌کند. در آینده، قابلیت‌های دیگری مانند لیست سفید (Whitelisting)، لیست سیاه (Blacklisting) و مدیریت ترافیک به نیبرلینک افزوده خواهد شد.

سیتی لینک (CityLink) یکی از گزینه‌های نیبرلینک است که با استفاده از آن می‌توان از راه دور و با استفاده از اینترنت داخلی یک کشور، به‌صورت امن و ناشناس به استارلینک متصل شد. در حال حاضر، می‌توان با پروکسی‌هایی مانند  FoxyProxy و Potasto و همچنین با استفاده از Outline، از سیتی لینک استفاده کرد.

NeighborLink enables individuals in close proximity to a Starlink terminal to retain secure internet access, demonstrating its effectiveness in circumventing widespread internet restrictions.
The core advantage of NeighborLink is providing resilient local internet access, designed to be impervious to nationwide shutdowns.

In scenarios where the government enforces a complete internet blackout, this system ensures that individuals with local access, for example, residents within a building, maintain uninterrupted internet connectivity. This is done by bypassing the Starlink’s proprietary router to use a generic off-the-shelf router and install customized OpenWRT OS on the router to share the Starlink’s internet bandwidth.

Key developments including a user management dashboard, split tunneling and VPN technology have been implemented, with future enhancements planned for whitelisting, blacklisting, and traffic management.

CityLink is a feature to enable remote use of Starlink via the domestic internet. In essence, CityLink is composed of two separate methods:
Proxy (such as FoxyProxy and Potatso)
Outline.
Both the administrator and users can utilize either or both methods according to their needs.
The CityLink solution was designed with an understanding of, and in response to, the dual structure of Iran's internet - differences in domestic and international internet censorship.

The solution includes integrating a cloud server, empowering users to create personal servers, and implementing firewalls to conceal satellite connections. An assessment of Iranian internet providers favored fiber internet and point-to-point connections for their performance and security.
