package com.five.svgstudio.models;

import com.five.Routes;
import com.five.core.BaseEndpoint;

import jakarta.servlet.annotation.WebServlet;


@WebServlet(Routes.svgstudio.models.any)
public class Endpoint extends BaseEndpoint {

    public Endpoint() {
        super(Routes.svgstudio.models.index_jsp);
    }
}
