Vue.component('item-select', {
	template: `<select id="select-item" :value="value" @input="handleInput">
			<option disabled value="">Select an Item</option>
			<optgroup v-for="scene in itemList" v-if="scene.items.length>0" :label="scene.name">
				<option v-for="item in scene.items" :value="item.id" :key="item.id">{{item.name}}</option>
			</optgroup>
			</select>`,
	props: ['itemList', 'value'],
	methods: {
		handleInput(e) {
			let item = _.find(_.flatMapDeep(this.itemList, (o) => o.items), {
				id: e.target.value
			});
			this.$emit('input', e.target.value);
		}
	}
});
Vue.component('move-resize', {
	template: `<div id="move-resize-container">
		<div id="frame" ref="frame" :style="frameStyle">
		</div>
		<div id="item" ref="item" :style="itemStyle" @mousedown.self.prevent="startDrag" :class={oversize:oversize}>
			<div id="h-tl" class="handle" @mousedown.prevent="startScale({x:'left',y:'top'})"></div>
			<div id="h-tr" class="handle" @mousedown.prevent="startScale({x:'right',y:'top'})"></div>
			<div id="h-bl" class="handle" @mousedown.prevent="startScale({x:'left',y:'bottom'})"></div>
			<div id="h-br" class="handle" @mousedown.prevent="startScale({x:'right',y:'bottom'})"></div>
			<!--<div id="origin" :style="{left:this.frame.left - this.item.left + (this.frame.originX),top:this.frame.top - this.item.top + (this.frame.originY)}"></div>-->
		</div>
	</div>`,
	props: ['frame', 'item', 'oversize'],
	computed: {
		itemOrigin() {
			let originX = this.frame.left - this.item.left + (this.frame.originX);
			let originY = this.frame.top - this.item.top + (this.frame.originY);
			return originX + 'px ' + originY + 'px';
		},
		frameStyle() {
			return {
				top: this.frame.top,
				right: this.frame.right,
				bottom: this.frame.bottom,
				left: this.frame.left,
				'transform': 'rotate(' + this.frame.rotateZ + 'deg)'
			}
		},
		itemStyle() {
			return {
				top: this.item.top,
				right: this.item.right,
				bottom: this.item.bottom,
				left: this.item.left,
				'transform-origin': this.itemOrigin,
				'transform': 'rotate(' + this.frame.rotateZ + 'deg)'
			}
		}
	},
	methods: {
		startDrag(e) {
			this.$emit('set-mode', {
				action: 'drag'
			})
		},
		startScale(e) {
			this.$emit('set-mode', {
				action: 'scale',
				x: e.x,
				y: e.y
			})
		},
		getInfo(ref) {
			return this.$refs[ref].getBoundingClientRect();
		}
	},
	mounted() {}
});

function initVue() {
	app = new Vue({
		el: '#app',
		data: {
			targetItem: '',
			mode: false,
			slow: false,
			item: {
				bottom: 0,
				right: 0,
				left: 0,
				top: 0,
			},
			xsplit: {
				stage: {
					width: 1920,
					height: 1080
				},
				frame: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
					width: 0,
					height: 0,
					canvasRotate: 0,
					rotateZ: 0
				},
				item: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
					width: false,
					height: false,
					nativeWidth: false,
					nativeHeight: false
				},
				target: false
			},
			xjsTarget: false,
			itemList: false
		},
		computed: {
			stageRatio() {
				return this.xsplit.stage.width / 400;
			},
			oversize() {
				let itemWidth = Math.floor((this.stage.width - this.item.right - this.item.left) * this.stageRatio);
				let itemHeight = Math.floor((this.stage.height - this.item.top - this.item.bottom) * this.stageRatio);
				return (this.xsplit.item.nativeWidth && (itemWidth > this.xsplit.item.nativeWidth || itemHeight > this.xsplit.item.nativeHeight))
			},
			frame() {
				return {
					top: this.xsplit.frame.top / this.stageRatio,
					right: this.xsplit.frame.right / this.stageRatio,
					bottom: this.xsplit.frame.bottom / this.stageRatio,
					left: this.xsplit.frame.left / this.stageRatio,
					originX: ((this.xsplit.stage.width - this.xsplit.frame.right - this.xsplit.frame.left) / this.stageRatio) / 2,
					originY: ((this.xsplit.stage.height - this.xsplit.frame.top - this.xsplit.frame.bottom) / this.stageRatio) / 2,
					canvasRotate: this.xsplit.frame.canvasRotate,
					rotateZ: this.xsplit.frame.rotateZ
				};
			},
			stage() {
				return {
					width: 400,
					height: this.xsplit.stage.height / this.stageRatio,
					left: 0,
					top: 0,
				};
			}

		},
		watch: {
			targetItem(value) {
				if (value) {
					xjs.Scene.searchItemsById(value).then((item) => {
						this.xjsTarget = item;
						this.setupStage();
					});
				}
			}
		},
		methods: {
			handleMode(mode) {
				this.mode = mode;
			},
			handleMouseMove(e) {
				let rotated;
				if (this.mode.action) {
					rotated = this.rotate(e.movementX, e.movementY, 0, 0, -this.frame.rotateZ);
				}
				if (this.mode.action == 'drag') {
					let bounds = {
						top: this.item.top + (this.slow ? rotated[1] / this.stageRatio : rotated[1]),
						right: this.item.right - (this.slow ? rotated[0] / this.stageRatio : rotated[0]),
						bottom: this.item.bottom - (this.slow ? rotated[1] / this.stageRatio : rotated[1]),
						left: this.item.left + (this.slow ? rotated[0] / this.stageRatio : rotated[0]),
					}
					this.item = this.checkBounds(bounds);
					this.setCrop();
				}
				if (this.mode.action == 'scale') {
					let bounds = {
						top: this.item.top,
						right: this.item.right,
						bottom: this.item.bottom,
						left: this.item.left,
					};
					bounds = this.scaleBox(bounds, this.slow ? [rotated[0] / this.stageRatio, rotated[1] / this.stageRatio] : [rotated[0], rotated[1]]);

					bounds = this.checkBounds(bounds);
					this.item = bounds;
					this.setCrop();
				}
			},
			scaleBox(bounds, delta) {
				delta[1] = delta[0] * (this.xsplit.item.height / this.xsplit.item.width); //lock aspect ratio

				if (this.mode.x == 'right') {
					bounds.right = bounds.right - delta[0];
					if (this.mode.y == 'bottom') {
						bounds.bottom = bounds.bottom - delta[1];
					} else if (this.mode.y == 'top') {
						bounds.top = bounds.top - delta[1];
					}
				} else if (this.mode.x == 'left') {
					bounds.left = bounds.left + delta[0];
					if (this.mode.y == 'bottom') {
						bounds.bottom = bounds.bottom + delta[1];
					} else if (this.mode.y == 'top') {
						bounds.top = bounds.top + delta[1];
					}
				}

				return bounds;
			},
			checkBounds(bounds) {
				let correction = [0, 0];
				if (bounds.left > this.frame.left) {
					correction[0] = this.frame.left - bounds.left;
				} else if (bounds.right > this.frame.right) {
					correction[0] = -(this.frame.right - bounds.right);
				}
				if (bounds.top > this.frame.top) {
					correction[1] = this.frame.top - bounds.top;
				} else if (bounds.bottom > this.frame.bottom) {
					correction[1] = -(this.frame.bottom - bounds.bottom);
				}
				if (this.mode.action == 'drag') {
					bounds = {
						top: bounds.top + correction[1],
						right: bounds.right - correction[0],
						bottom: bounds.bottom - correction[1],
						left: bounds.left + correction[0],
					}
				}
				if (this.mode.action == 'scale') {
					if (Math.abs(correction[1]) > Math.abs(correction[0])) {
						correction[0] = correction[1] / (this.xsplit.item.height / this.xsplit.item.width);
						if (this.mode.x == 'right' && this.mode.y == 'top' || this.mode.x == 'left' && this.mode.y == 'bottom') {
							correction[0] = -correction[0];
						}
					}
					bounds = this.scaleBox(bounds, correction)

				}
				return bounds;
			},
			handleKeydown(e) {
				if (e.key == 'Control') {
					this.slow = true;
				}
			},
			handleKeyup(e) {
				if (e.key == 'Control') {
					this.slow = false;
				}
			},
			rotateCrop(obj, angle) { //translate xsplit crop values if item is rotated
				if (angle == 270) {
					obj = {
						top: obj.right,
						right: obj.bottom,
						bottom: obj.left,
						left: obj.top,
					}
				} else if (angle == 180) {
					obj = {
						top: obj.bottom,
						right: obj.left,
						bottom: obj.top,
						left: obj.right,
					}
				} else if (angle == 90) {
					obj = {
						top: obj.left,
						right: obj.top,
						bottom: obj.right,
						left: obj.bottom,
					}
				}
				return obj;
			},
			setupStage() {
				Promise.all([this.xjsTarget.getPosition(), this.xjsTarget.getCropping(), this.xjsTarget.getCanvasRotate(), this.xjsTarget.getRotateZ(), this.xjsTarget.getType()]).then(([frame, crop, rotate, rotateZ, type]) => {

					this.resizeStage();

					this.xsplit.frame = {
						top: frame.getTop() * this.xsplit.stage.height,
						right: (1 - frame.getRight()) * this.xsplit.stage.width,
						bottom: (1 - frame.getBottom()) * this.xsplit.stage.height,
						left: frame.getLeft() * this.xsplit.stage.width,
						width: frame.getWidth() * this.xsplit.stage.width,
						height: frame.getHeight() * this.xsplit.stage.height,
						canvasRotate: rotate,
						rotateZ: rotateZ
					};

					crop = this.rotateCrop(crop, this.xsplit.frame.canvasRotate) //translate xsplit crop values if item is rotated
					this.xsplit.item = {
						width: this.xsplit.frame.width / (1 - (crop.left + crop.right)),
						height: this.xsplit.frame.height / (1 - (crop.bottom + crop.top)),
						nativeWidth: false,
						nativeHeight: false
					}
					this.xsplit.item.top = this.xsplit.frame.top - (crop.top * this.xsplit.item.height);
					this.xsplit.item.right = this.xsplit.frame.right - (crop.right * this.xsplit.item.width);
					this.xsplit.item.bottom = this.xsplit.frame.bottom - (crop.bottom * this.xsplit.item.height);
					this.xsplit.item.left = this.xsplit.frame.left - (crop.left * this.xsplit.item.width);

					//low level xjs API to get native item resolution
					window.external.SearchVideoItem(this.targetItem.id);
					let itemRes = window.external.GetLocalProperty('prop:resolution').split(',');
					this.xsplit.item.nativeWidth = parseInt(itemRes[0]);
					this.xsplit.item.nativeHeight = parseInt(itemRes[1]);
					window.external.SearchVideoItem('');
					//-----------------

					this.item = {
						top: this.xsplit.item.top / this.stageRatio,
						right: this.xsplit.item.right / this.stageRatio,
						bottom: this.xsplit.item.bottom / this.stageRatio,
						left: this.xsplit.item.left / this.stageRatio,
					};

				});

			},
			resizeStage() {
				xjsApp.getResolution().then((res) => {
					this.xsplit.stage.width = res.getWidth();
					this.xsplit.stage.height = res.getHeight();
					xjs.ExtensionWindow.resize(415, (415 / (this.xsplit.stage.width / this.xsplit.stage.height)) + 40);
				});
			},
			clearStage() {
				this.xsplit.frame = {};
				this.xsplit.item = {};
				this.targetItem = '';
				this.item = {};
			},
			setItemList() {
				this.getAllItems().then((list) => {
					this.itemList = list;
				})
			},
			rotate(x, y, xm, ym, a) {
				var cos = Math.cos,
					sin = Math.sin,

					a = a * Math.PI / 180,
					xr = (x - xm) * cos(a) - (y - ym) * sin(a) + xm,
					yr = (x - xm) * sin(a) + (y - ym) * cos(a) + ym;

				return [xr, yr];
			},
			setCrop() {
				let itemWidth = this.stage.width - this.item.right - this.item.left;
				let itemHeight = this.stage.height - this.item.top - this.item.bottom;
				let xsplitCrop = {
					top: (this.frame.top - this.item.top) / itemHeight,
					right: (this.frame.right - this.item.right) / itemWidth,
					bottom: (this.frame.bottom - this.item.bottom) / itemHeight,
					left: (this.frame.left - this.item.left) / itemWidth,
				}
				xsplitCrop = this.rotateCrop(xsplitCrop, 360 - this.xsplit.frame.canvasRotate);

				this.xjsTarget.setCropping(xsplitCrop);
			},
			async getAllItems() {
				let itemList = [{
					id: 'i12',
					items: []
				}]

				let numScenes = await xjs.Scene.getSceneCount();
				for (let i = 0; i < numScenes; i++) {
					itemList.push({
						id: i,
						items: []
					})
				}
				itemList.forEach(async (value, i) => {
					let scene = await xjs.Scene.getBySceneIndex(value.id);
					value.name = await scene.getName();
					if (value.id == 'i12' && value.name == 'null') {
						itemList = _.drop(itemList);
					} else if (!await scene.isEmpty()) {
						if (value.id == 'i12') {
							value.name = 'Preview';
						}
						let items = await scene.getItems();
						items.forEach(async (item) => {
							value['items'].push({
								id: await item.getId(),
								name: await item.getCustomName() || await item.getName()
							});
						});
					}
				});
				return itemList;
			}
		},
		mounted() {
			window.addEventListener('mouseup', () => this.mode = false);
			window.addEventListener('mousemove', this.handleMouseMove);
			window.addEventListener('keydown', this.handleKeydown);
			window.addEventListener('keyup', this.handleKeyup);

			xjs.ExtensionWindow.on('sources-list-select', async (itemId) => {
				if (itemId) {
					let item = await xjs.Scene.searchItemsById(itemId)
					this.targetItem = await item.getId();
				} else {
					this.clearStage();
				}
			});
			xjs.ExtensionWindow.on('scene-add', () => {
				this.setItemList();
			});

			this.resizeStage()
			this.setItemList();
		}
	});
}