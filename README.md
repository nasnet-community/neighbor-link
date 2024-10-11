# NeighborLink


## [Installation Guide](https://github.com/nasnet-community/solutions/tree/main/neighbor-link)

نیبرلینک سیستمی است که اجازه می‌دهد تا افرادی که در شعاع دسترسی یک دستگاه استارلینک و اسکتندرهای آن قرار دارند، حتی در شرایطی که اینترنت داخلی و بین‌المللی یک کشور نیز به‌طور کامل شات‌داون شده، به اینترنت امن و پرسرعت دسترسی داشته باشند.

نیبرلینک یک OpenWRT OS شخصی‌سازی شده است که به ادمین امکان می‌دهد اینترنت استارلینک را با کاربران دیگران - مثلا همسایه‌ها - به اشتراک بگذارد. نیبرلینک در حال حاضر امکان مدیریت کاربران، تفکیک مسیر (split tunneling) و ماسک‌کردن آی‌پی با استفاده از وی‌پی‌ان را فراهم می‌کند. در آینده کاربردهای دیگر، از جمله whitelisting, blacklisting و مدیریت ترافیک به نیبرلینک افزوده خواهد شد.

اینفنیت‌ریچ (Infinite Reach) یکی از گزینه‌های نیبرلینک است که با استفاده از آن می‌توان از راه دور و با استفاده از اینترنت داخلی یک کشور به‌طور امن و ناشناس به استارلینک وصل شد. در حال حاضر هم می‌توان با پروکسی‌هایی مثل SwitchyOmega, FoxyProxy و Potasto و هم با استفاده از Outline از اینفینیت‌ریچ استفاده کرد.


NeighborLink enables individuals in close proximity to a Starlink terminal to retain secure internet access, demonstrating its effectiveness in circumventing widespread internet restrictions.
The core advantage of NeighborLink is providing resilient local internet access, designed to be impervious to nationwide shutdowns.

In scenarios where the government enforces a complete internet blackout, this system ensures that individuals with local access, for example, residents within a building, maintain uninterrupted internet connectivity. This is done by bypassing the Starlink’s proprietary router to use a generic off-the-shelf router and install customized OpenWRT OS on the router to share the Starlink’s internet bandwidth.

Key developments including a user management dashboard, split tunneling and VPN technology have been implemented, with future enhancements planned for whitelisting, blacklisting, and traffic management.

Infinite Reach is a feature to enable remote use of Starlink via the domestic internet. In essence, Infinite Reach is composed of two separate methods:
Proxy (such as SwitchyOmega, FoxyProxy, Potatso)
Outline.
Both the administrator and users can utilize either or both methods according to their needs.
The Infinite Reach solution was designed with an understanding of, and in response to, the dual structure of Iran's internet - differences in domestic and international internet censorship.

The solution includes integrating a cloud server, empowering users to create personal servers, and implementing firewalls to conceal satellite connections. An assessment of Iranian internet providers favored fiber internet and point-to-point connections for their performance and security.
