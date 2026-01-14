package com.five;
public final class Routes{
public static final String root = "";
public static class api{
public static final String root = "/api";
public static final String any = "/api/*";
};
public static class birthdays{
public static final String root = "/birthdays";
public static final String any = "/birthdays/*";
public static class api{
public static final String root = "/birthdays/api";
public static final String any = "/birthdays/api/*";
};
public static final String index_html="/birthdays/index.html";
};
public static class core{
public static final String root = "/core";
public static final String any = "/core/*";
};
public static class hangman{
public static final String root = "/hangman";
public static final String any = "/hangman/*";
public static final String index_html="/hangman/index.html";
};
public static final String index_html="/index.html";
public static class landing{
public static final String root = "/landing";
public static final String any = "/landing/*";
};
public static class marbles{
public static final String root = "/marbles";
public static final String any = "/marbles/*";
public static final String game_html="/marbles/game.html";
public static final String index_html="/marbles/index.html";
public static final String standalone_html="/marbles/standalone.html";
};
public static class META_INF{
public static final String root = "/META-INF";
public static final String any = "/META-INF/*";
public static class svgstudio{
public static final String root = "/META-INF/svgstudio";
public static final String any = "/META-INF/svgstudio/*";
public static class actions{
public static final String root = "/META-INF/svgstudio/actions";
public static final String any = "/META-INF/svgstudio/actions/*";
public static final String index_jsp="/META-INF/svgstudio/actions/index.jsp";
};
public static class models{
public static final String root = "/META-INF/svgstudio/models";
public static final String any = "/META-INF/svgstudio/models/*";
public static final String index_jsp="/META-INF/svgstudio/models/index.jsp";
};
};
};
public static class pac_man{
public static final String root = "/pac-man";
public static final String any = "/pac-man/*";
public static final String index_html="/pac-man/index.html";
};
public static class reviews{
public static final String root = "/reviews";
public static final String any = "/reviews/*";
public static final String index_html="/reviews/index.html";
};
public static class shared{
public static final String root = "/shared";
public static final String any = "/shared/*";
};
public static class speedsweeper{
public static final String root = "/speedsweeper";
public static final String any = "/speedsweeper/*";
public static final String index_html="/speedsweeper/index.html";
public static final String standalone_html="/speedsweeper/standalone.html";
};
public static class svgstudio{
public static final String root = "/svgstudio";
public static final String any = "/svgstudio/*";
public static class actions{
public static final String root = "/svgstudio/actions";
public static final String any = "/svgstudio/actions/*";
public static final String index_jsp="/svgstudio/actions/index.jsp";
};
public static final String index_html="/svgstudio/index.html";
public static class models{
public static final String root = "/svgstudio/models";
public static final String any = "/svgstudio/models/*";
public static final String index_jsp="/svgstudio/models/index.jsp";
};
};
public static class tetris{
public static final String root = "/tetris";
public static final String any = "/tetris/*";
public static final String index_html="/tetris/index.html";
};
public static class tic_tac_toe{
public static final String root = "/tic-tac-toe";
public static final String any = "/tic-tac-toe/*";
public static final String index_html="/tic-tac-toe/index.html";
};
public static class times_tables{
public static final String root = "/times-tables";
public static final String any = "/times-tables/*";
public static final String index_html="/times-tables/index.html";
};
}
