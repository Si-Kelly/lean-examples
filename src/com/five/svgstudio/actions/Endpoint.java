package com.five.svgstudio.actions;

import com.five.Routes;
import com.five.core.BaseEndpoint;

import jakarta.servlet.annotation.WebServlet;

@WebServlet(Routes.svgstudio.actions.any)
public class Endpoint extends BaseEndpoint {

    public Endpoint() {
        super(Routes.svgstudio.actions.index_jsp);
    }

}
