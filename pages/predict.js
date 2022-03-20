import { Button } from "antd";
import React, { useState, useEffect } from "react";
import "antd/dist/antd.css";
import styles from "./predict.module.scss";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import {
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Cascader,
  InputNumber,
  Mentions,
  TreeSelect,
  Upload,
  Col,
  message,
} from "antd";
import { Bar, Area, Column } from "@antv/g2plot";
import { Chart } from "@antv/g2";
import DataSet from "@antv/data-set";

const { Option } = Select;
const { Dragger } = Upload;

function Predict() {
  const [predictResult, setpredictResult] = useState(null);
  useEffect(() => {
    if (predictResult == null) return;
    const emd_lable_data = [
      {
        value: 0,
        percent: predictResult.predict.filter((ele) => ele.emd_lable == 0)
          .length,
      },
      {
        value: 1,
        percent: predictResult.predict.filter((ele) => ele.emd_lable == 1)
          .length,
      },
    ];
    const emd_lable_table = new Bar("emd_lable", {
      data: emd_lable_data,
      xField: "percent",
      yField: "value",
      seriesField: "value",
      legend: {
        position: "top-left",
      },
    });
    emd_lable_table.render();
    const predict_next_data = [
      "0~0.1",
      "0.1~0.2",
      "0.2~0.3",
      "0.3~0.4",
      "0.4~0.5",
      "0.5~0.6",
      "0.6~0.7",
      "0.7~0.8",
      "0.8~0.9",
      "0.9~1",
    ].map((current, index) => {
      return {
        type: current,
        percent:
          predictResult.predict.filter((ele) => {
            return (
              ele.predict_next >= index / 10 &&
              ele.predict_next < (index + 1) / 10
            );
          }).length / predictResult.predict.length,
      };
    });
    const predict_next_table = new Column("predict_next", {
      data: predict_next_data,
      xField: "type",
      yField: "percent",
      label: {
        // 可手动配置 label 数据标签位置
        position: "middle", // 'top', 'bottom', 'middle',
        // 配置样式
        style: {
          fill: "#FFFFFF",
          opacity: 0.6,
        },
      },
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: false,
        },
      },
      meta: {
        type: {
          alias: "类型",
        },
        percent: {
          alias: "占比",
        },
      },
    });
    predict_next_table.render();
    const pax_data = predictResult.predict;
    const pax_table = new Chart({
      container: "pax",
      autoFit: true,
      height: 500,
    });
    // 数据格式： [{"pax_fcny_dense":715.0,"pax_tax_dense":161.2}]
    pax_table.data(pax_data);
    pax_table.scale({
      pax_fcny_dense: { nice: true },
      pax_tax_dense: { nice: true },
    });
    pax_table.tooltip({
      showTitle: false,
      showCrosshairs: true,
      crosshairs: {
        type: "xy",
      },
      itemTpl:
        '<li class="g2-tooltip-list-item" data-index={index} style="margin-bottom:4px;">' +
        '<span style="background-color:{color};" class="g2-tooltip-marker"></span>' +
        "{name}<br/>" +
        "{value}" +
        "</li>",
    });
    pax_table
      .point()
      .position("pax_fcny_dense*pax_tax_dense")
      .shape("circle")
      .tooltip(
        "pax_fcny_dense*pax_tax_dense",
        (pax_fcny_dense, pax_tax_dense) => {
          return {
            name: "详细信息",
            value:
              "pax_fcny_dense: " +
              pax_fcny_dense +
              ", pax_tax_dense: " +
              pax_tax_dense,
          };
        }
      )
      .style({
        fillOpacity: 0.85,
      });
    pax_table.interaction("legend-highlight");
    pax_table.render();

    const tkt_table = new Chart({
      container: "tkt",
      autoFit: true,
      height: 500,
    });
    const dv = new DataSet.View().source(predictResult.predict);
    dv.transform({
      type: "kernel-smooth.density",
      fields: ["tkt_3y_amt_dense", "tkt_i_amt_y3_dense"],
      as: ["tkt_3y_amt_dense", "tkt_i_amt_y3_dense", "density"],
    });
    tkt_table.data(predictResult.predict);
    tkt_table.scale({
      tkt_3y_amt_dense: { nice: true },
      tkt_i_amt_y3_dense: { nice: true },
      density: { nice: true },
    });
    tkt_table.point().position("tkt_3y_amt_dense*tkt_i_amt_y3_dense");
    const view = tkt_table.createView({
      padding: 0,
    });
    view.axis(false);
    view.data(dv.rows);
    view
      .heatmap()
      .position("tkt_3y_amt_dense*tkt_i_amt_y3_dense")
      .color("density", "blue-cyan-lime-yellow-red");
    tkt_table.render();

    const avg_data = predictResult.predict.map((ele) => {
      return {
        ...ele,
        x: ele.avg_pref_city_radius_y3_dense / 1000,
        y: ele.avg_pref_orig_radius_y3_dense / 1000,
      };
    });
    const { DataView } = DataSet;
    const dv2 = new DataView();
    dv2.source(avg_data).transform({
      type: "bin.rectangle",
      fields: [
        "avg_pref_city_radius_y3_dense",
        "avg_pref_orig_radius_y3_dense",
      ],
    });
    const avg_table = new Chart({
      container: "avg",
      autoFit: true,
      height: 500,
      padding: [20, 20, 50, 80],
    });
    avg_table.data(dv2.rows);
    avg_table.scale({
      y: { nice: true },
      count: { nice: true },
    });
    avg_table.tooltip({
      showTitle: false,
      showMarkers: false,
    });
    avg_table
      .polygon()
      .position("x*y")
      .color("count", ["#BAE7FF", "#1890FF", "#0050B3"]);
    avg_table.interaction("element-active");
    avg_table.render();

    const tkt_book_table = new Chart({
      container: "tkt_book",
      autoFit: true,
      height: 500,
    });
    const tkt_book_data = [
      {
        type: "zero",
        value: predictResult.predict.filter(
          (ele) => ele.tkt_book_cnt_y3_dense == 0
        ).length,
      },
      {
        type: "non-zero",
        value: predictResult.predict.filter(
          (ele) => ele.tkt_book_cnt_y3_dense != 0
        ).length,
      },
    ];
    tkt_book_table.data(tkt_book_data);
    tkt_book_table.coordinate("theta", {
      radius: 0.75,
    });
    tkt_book_table.tooltip({
      showMarkers: false,
    });
    const interval = tkt_book_table
      .interval()
      .adjust("stack")
      .position("value")
      .color("type", ["#47abfc", "#38c060"])
      .style({ opacity: 0.4 })
      .state({
        active: {
          style: (element) => {
            const shape = element.shape;
            return {
              matrix: Util.zoom(shape, 1.1),
            };
          },
        },
      })
      .label("type", (val) => {
        const opacity = val === "zero" ? 0.5 : 0;
        return {
          offset: -30,
          style: {
            opacity,
            fill: "white",
            fontSize: 12,
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
          },
          content: (obj) => {
            return obj.type + "\n" + obj.value + "%";
          },
        };
      });
    tkt_book_table.interaction("element-single-selected");
    tkt_book_table.render();

    const feature_importance_data = predictResult.feature_importance.filter(
      (ele) => ele.value >= 0.015
    );
    const feature_importance_table = new Chart({
      container: "feature_importance",
      autoFit: true,
      height: 500,
      padding: [40, 0],
    });
    feature_importance_table.data(feature_importance_data);
    feature_importance_table.coordinate("polar", {
      startAngle: Math.PI, // 起始角度
      endAngle: Math.PI * (3 / 2), // 结束角度
    });
    feature_importance_table.scale("value", {
      tickCount: 6,
    });
    feature_importance_table.axis("value", {
      grid: {
        line: {
          type: "circle",
        },
        closed: false,
      },
      verticalFactor: 1,
      label: {
        offset: 15,
      },
    });
    feature_importance_table.axis("feature_name", {
      tickLine: {
        alignTick: false,
      },
      grid: {
        alignTick: false,
      },
    });
    feature_importance_table.tooltip({
      showMarkers: false,
    });
    feature_importance_table.interaction("element-highlight");
    feature_importance_table
      .interval()
      .position("feature_name*value")
      .color("feature_name", "rgb(252,143,72)-rgb(255,215,135)")
      .label("value", {
        offset: -15,
        style: {
          textAlign: "center",
          fill: "#000",
        },
      })
      .style({
        lineWidth: 1,
        stroke: "#fff",
      });

    feature_importance_table.render();
  }, [predictResult]);

  const props = {
    name: "file",
    multiple: true,
    action: "http://localhost:8000/seat_selection/predict/",
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
        setpredictResult(info.file.response[0]);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };
  switch (predictResult) {
    case null:
      return (
        <div className={styles["main-page"]}>
          <h1 className={styles["title"]}>上传需要预测的数据</h1>
          <Form wrapperCol={{ span: 24 }}>
            <Form.Item wrapperCol={{ span: 20, offset: 2 }}>
              <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Support for a single or bulk upload. Strictly prohibit from
                  uploading company data or other band files
                </p>
              </Dragger>
            </Form.Item>
            <Form.Item wrapperCol={{ span: 2, offset: 11 }}>
              <Button type="primary" htmlType="submit">
                上传
              </Button>
            </Form.Item>
          </Form>
        </div>
      );
    default:
      return (
        <div className={styles["result-display"]}>
          <div className={styles["wrapper"]}>
            <h1>emd lable</h1>
            <div id="emd_lable"></div>
            <h1>predict next</h1>
            <div id="predict_next"></div>
            <h1>pax data</h1>
            <div id="pax"></div>
            <h1>tkt visualization</h1>
            <div id="tkt"></div>
            <h1>avg data visualization</h1>
            <div id="avg"></div>
            <h1> tkt book</h1>
            <div id="tkt_book"></div>
            <h1>feature importance(&gt;=0.015)</h1>
            <div id="feature_importance"></div>
          </div>
        </div>
      );
  }
}

export default Predict;
